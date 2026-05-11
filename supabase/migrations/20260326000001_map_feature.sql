-- ═══════════════════════════════════════════════════════════════
-- AMARI Map Feature — PostGIS + Region Centroids + Projects v2 + Cache Tables
-- Migration: 20260326000001_map_feature.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Enable PostGIS ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── 2. Project Categories ─────────────────────────────────
-- Canonical seven-category taxonomy used everywhere
CREATE TYPE project_category AS ENUM (
  'venture', 'advisory', 'creative', 'impact', 'culture', 'health', 'tech'
);

CREATE TYPE project_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE geo_level AS ENUM ('country', 'state', 'city');

-- ─── 3. Region Centroids ───────────────────────────────────
-- Pre-populated with Natural Earth admin-1 + curated city list (100K+ pop)
-- Members select from this list — never type addresses
CREATE TABLE region_centroids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  state_province text,
  city_name text,
  population integer,
  display_label text NOT NULL,
  geo_level geo_level NOT NULL,
  centroid geometry(POINT, 4326) NOT NULL
);

CREATE INDEX region_centroids_geo_idx ON region_centroids USING GIST (centroid);
CREATE INDEX region_centroids_country_idx ON region_centroids (country_code);
CREATE INDEX region_centroids_level_idx ON region_centroids (geo_level);

-- RLS: all authenticated users can read regions
ALTER TABLE region_centroids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read regions"
  ON region_centroids FOR SELECT
  TO authenticated
  USING (true);

-- ─── 4. Projects Table (v2 — replaces aligned_tiles for map) ──
-- aligned_tiles remains for backward compat; projects is the new canonical table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL CHECK (char_length(description) <= 100),
  category project_category NOT NULL,
  region_id uuid NOT NULL REFERENCES region_centroids(id),
  display_point geometry(POINT, 4326),
  image_url text,
  image_path text,
  external_link text,
  status project_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX projects_status_idx ON projects (status);
CREATE INDEX projects_geo_idx ON projects USING GIST (display_point);
CREATE INDEX projects_category_idx ON projects (category);
CREATE INDEX projects_creator_idx ON projects (creator_id);

-- RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Creators can CRUD their own projects
CREATE POLICY "Creators can manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = creator_id);

-- All authenticated users can read approved projects
CREATE POLICY "Users can read approved projects"
  ON projects FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- ─── 5. Project Bookmarks ──────────────────────────────────
CREATE TABLE project_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(member_id, project_id)
);

ALTER TABLE project_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks"
  ON project_bookmarks FOR ALL
  USING (auth.uid() = member_id);

-- ─── 6. Map Cache Tables (weekly refresh) ──────────────────

-- Country-level aggregates (zoom 0-4)
CREATE TABLE map_cache_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  project_count integer NOT NULL,
  categories jsonb NOT NULL DEFAULT '{}',
  centroid geometry(POINT, 4326) NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX map_cache_countries_geo_idx ON map_cache_countries USING GIST (centroid);

-- State-level aggregates (zoom 5-6)
CREATE TABLE map_cache_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  state_province text NOT NULL,
  display_label text NOT NULL,
  project_count integer NOT NULL,
  categories jsonb NOT NULL DEFAULT '{}',
  centroid geometry(POINT, 4326) NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX map_cache_states_geo_idx ON map_cache_states USING GIST (centroid);

-- Individual project points (zoom 7-8) — privacy-degraded
CREATE TABLE map_cache_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  category project_category NOT NULL,
  creator_first_name text NOT NULL,
  display_label text NOT NULL,
  image_url text,
  external_link text,
  display_point geometry(POINT, 4326) NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX map_cache_projects_geo_idx ON map_cache_projects USING GIST (display_point);

-- Cache tables: read-only for authenticated users
ALTER TABLE map_cache_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_cache_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_cache_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read country cache"
  ON map_cache_countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read state cache"
  ON map_cache_states FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read project cache"
  ON map_cache_projects FOR SELECT TO authenticated USING (true);

-- ─── 7. RPC Functions for Map Queries ──────────────────────

-- Zoom 0-4: country clusters
CREATE OR REPLACE FUNCTION map_countries(
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  country_code text,
  country_name text,
  project_count integer,
  categories jsonb,
  lat double precision,
  lng double precision
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    country_code,
    country_name,
    project_count,
    categories,
    ST_Y(centroid) as lat,
    ST_X(centroid) as lng
  FROM map_cache_countries
  WHERE (category_filter IS NULL OR categories ? category_filter);
$$;

-- Zoom 5-6: state clusters within viewport
CREATE OR REPLACE FUNCTION map_states(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  state_province text,
  display_label text,
  project_count integer,
  categories jsonb,
  lat double precision,
  lng double precision
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    state_province,
    display_label,
    project_count,
    categories,
    ST_Y(centroid) as lat,
    ST_X(centroid) as lng
  FROM map_cache_states
  WHERE ST_Intersects(
    centroid,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  )
  AND (category_filter IS NULL OR categories ? category_filter);
$$;

-- Zoom 7-8: individual projects within viewport
CREATE OR REPLACE FUNCTION map_projects(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  name text,
  description text,
  category text,
  creator_first_name text,
  display_label text,
  image_url text,
  external_link text,
  lat double precision,
  lng double precision
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    project_id,
    name,
    description,
    category::text,
    creator_first_name,
    display_label,
    image_url,
    external_link,
    ST_Y(display_point) as lat,
    ST_X(display_point) as lng
  FROM map_cache_projects
  WHERE ST_Intersects(
    display_point,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  )
  AND (category_filter IS NULL OR category::text = category_filter);
$$;

-- ─── 8. Auto-populate display_point from region centroid ────
-- When a project is inserted, copy the region centroid to display_point
CREATE OR REPLACE FUNCTION set_project_display_point()
RETURNS TRIGGER AS $$
BEGIN
  SELECT centroid INTO NEW.display_point
  FROM region_centroids
  WHERE id = NEW.region_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_set_display_point
  BEFORE INSERT OR UPDATE OF region_id ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_display_point();

-- ─── 9. Updated_at trigger for projects ─────────────────────
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- ─── 10. Seed initial Australian regions ────────────────────
-- Core Australian states + major cities for launch
INSERT INTO region_centroids (country_code, country_name, state_province, city_name, population, display_label, geo_level, centroid) VALUES
  -- Country level
  ('AU', 'Australia', NULL, NULL, 26000000, 'Australia', 'country', ST_SetSRID(ST_MakePoint(133.7751, -25.2744), 4326)),
  -- States
  ('AU', 'Australia', 'Victoria', NULL, 6700000, 'Victoria, Australia', 'state', ST_SetSRID(ST_MakePoint(144.9631, -37.0201), 4326)),
  ('AU', 'Australia', 'New South Wales', NULL, 8200000, 'New South Wales, Australia', 'state', ST_SetSRID(ST_MakePoint(146.9211, -32.1631), 4326)),
  ('AU', 'Australia', 'Queensland', NULL, 5300000, 'Queensland, Australia', 'state', ST_SetSRID(ST_MakePoint(144.3500, -22.5752), 4326)),
  ('AU', 'Australia', 'South Australia', NULL, 1800000, 'South Australia, Australia', 'state', ST_SetSRID(ST_MakePoint(136.2092, -30.0002), 4326)),
  ('AU', 'Australia', 'Western Australia', NULL, 2800000, 'Western Australia, Australia', 'state', ST_SetSRID(ST_MakePoint(121.6283, -25.0421), 4326)),
  ('AU', 'Australia', 'Tasmania', NULL, 570000, 'Tasmania, Australia', 'state', ST_SetSRID(ST_MakePoint(146.3159, -42.0409), 4326)),
  ('AU', 'Australia', 'Northern Territory', NULL, 250000, 'Northern Territory, Australia', 'state', ST_SetSRID(ST_MakePoint(133.3846, -19.4914), 4326)),
  ('AU', 'Australia', 'Australian Capital Territory', NULL, 460000, 'ACT, Australia', 'state', ST_SetSRID(ST_MakePoint(149.0124, -35.4735), 4326)),
  -- Major cities
  ('AU', 'Australia', 'Victoria', 'Melbourne', 5100000, 'Melbourne, VIC', 'city', ST_SetSRID(ST_MakePoint(144.9631, -37.8136), 4326)),
  ('AU', 'Australia', 'New South Wales', 'Sydney', 5400000, 'Sydney, NSW', 'city', ST_SetSRID(ST_MakePoint(151.2093, -33.8688), 4326)),
  ('AU', 'Australia', 'Queensland', 'Brisbane', 2500000, 'Brisbane, QLD', 'city', ST_SetSRID(ST_MakePoint(153.0251, -27.4698), 4326)),
  ('AU', 'Australia', 'South Australia', 'Adelaide', 1400000, 'Adelaide, SA', 'city', ST_SetSRID(ST_MakePoint(138.6007, -34.9285), 4326)),
  ('AU', 'Australia', 'Western Australia', 'Perth', 2100000, 'Perth, WA', 'city', ST_SetSRID(ST_MakePoint(115.8605, -31.9505), 4326)),
  ('AU', 'Australia', 'Queensland', 'Gold Coast', 700000, 'Gold Coast, QLD', 'city', ST_SetSRID(ST_MakePoint(153.4000, -28.0167), 4326)),
  ('AU', 'Australia', 'Australian Capital Territory', 'Canberra', 460000, 'Canberra, ACT', 'city', ST_SetSRID(ST_MakePoint(149.1300, -35.2809), 4326)),
  ('AU', 'Australia', 'Tasmania', 'Hobart', 240000, 'Hobart, TAS', 'city', ST_SetSRID(ST_MakePoint(147.3272, -42.8821), 4326)),
  ('AU', 'Australia', 'Northern Territory', 'Darwin', 150000, 'Darwin, NT', 'city', ST_SetSRID(ST_MakePoint(130.8456, -12.4634), 4326)),
  -- International — key diaspora hubs
  ('GB', 'United Kingdom', 'England', 'London', 9000000, 'London, UK', 'city', ST_SetSRID(ST_MakePoint(-0.1278, 51.5074), 4326)),
  ('NG', 'Nigeria', 'Lagos', 'Lagos', 15000000, 'Lagos, Nigeria', 'city', ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326)),
  ('US', 'United States', 'New York', 'New York', 8300000, 'New York, US', 'city', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)),
  ('SG', 'Singapore', NULL, 'Singapore', 5900000, 'Singapore', 'city', ST_SetSRID(ST_MakePoint(103.8198, 1.3521), 4326)),
  ('AE', 'United Arab Emirates', 'Dubai', 'Dubai', 3500000, 'Dubai, UAE', 'city', ST_SetSRID(ST_MakePoint(55.2708, 25.2048), 4326)),
  ('ZA', 'South Africa', 'Gauteng', 'Johannesburg', 6000000, 'Johannesburg, SA', 'city', ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326)),
  ('KE', 'Kenya', 'Nairobi', 'Nairobi', 4700000, 'Nairobi, Kenya', 'city', ST_SetSRID(ST_MakePoint(36.8219, -1.2921), 4326)),
  ('GH', 'Ghana', 'Greater Accra', 'Accra', 2600000, 'Accra, Ghana', 'city', ST_SetSRID(ST_MakePoint(-0.1870, 5.6037), 4326)),
  -- Country-level entries for international
  ('GB', 'United Kingdom', NULL, NULL, 67000000, 'United Kingdom', 'country', ST_SetSRID(ST_MakePoint(-3.4360, 55.3781), 4326)),
  ('NG', 'Nigeria', NULL, NULL, 220000000, 'Nigeria', 'country', ST_SetSRID(ST_MakePoint(8.6753, 9.0820), 4326)),
  ('US', 'United States', NULL, NULL, 331000000, 'United States', 'country', ST_SetSRID(ST_MakePoint(-95.7129, 37.0902), 4326)),
  ('ZA', 'South Africa', NULL, NULL, 60000000, 'South Africa', 'country', ST_SetSRID(ST_MakePoint(22.9375, -30.5595), 4326)),
  ('KE', 'Kenya', NULL, NULL, 54000000, 'Kenya', 'country', ST_SetSRID(ST_MakePoint(37.9062, -0.0236), 4326)),
  ('GH', 'Ghana', NULL, NULL, 33000000, 'Ghana', 'country', ST_SetSRID(ST_MakePoint(-1.0232, 7.9465), 4326));
