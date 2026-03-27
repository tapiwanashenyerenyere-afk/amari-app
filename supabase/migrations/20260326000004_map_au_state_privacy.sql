-- Australia privacy hardening for Aligned map
-- Australia is always stored and displayed at state level.

-- Move any legacy Australian city-linked projects onto their matching state row.
UPDATE projects AS p
SET region_id = state_region.id
FROM region_centroids AS city_region
JOIN region_centroids AS state_region
  ON state_region.country_code = city_region.country_code
 AND state_region.state_province = city_region.state_province
 AND state_region.geo_level = 'state'
WHERE p.region_id = city_region.id
  AND city_region.country_code = 'AU'
  AND city_region.geo_level = 'city';

-- Remove Australian city rows so clients cannot select or query them.
DELETE FROM region_centroids
WHERE country_code = 'AU'
  AND geo_level = 'city';

-- Force future Australian projects to resolve to state level even if a city row is inserted later.
CREATE OR REPLACE FUNCTION enforce_project_region_privacy()
RETURNS TRIGGER AS $$
DECLARE
  source_region record;
  resolved_region_id uuid;
BEGIN
  SELECT country_code, state_province, geo_level
  INTO source_region
  FROM region_centroids
  WHERE id = NEW.region_id;

  IF source_region.country_code = 'AU' AND source_region.geo_level = 'city' THEN
    SELECT id
    INTO resolved_region_id
    FROM region_centroids
    WHERE country_code = 'AU'
      AND state_province = source_region.state_province
      AND geo_level = 'state'
    LIMIT 1;

    IF resolved_region_id IS NULL THEN
      SELECT id
      INTO resolved_region_id
      FROM region_centroids
      WHERE country_code = 'AU'
        AND geo_level = 'country'
      LIMIT 1;
    END IF;

    IF resolved_region_id IS NOT NULL THEN
      NEW.region_id = resolved_region_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_enforce_region_privacy ON projects;

CREATE TRIGGER project_enforce_region_privacy
  BEFORE INSERT OR UPDATE OF region_id ON projects
  FOR EACH ROW
  EXECUTE FUNCTION enforce_project_region_privacy();

-- Keep the cache safe even if legacy data or manual inserts reintroduce AU city rows.
CREATE OR REPLACE FUNCTION refresh_map_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  min_per_region integer := 3;
BEGIN
  DELETE FROM map_cache_countries;
  DELETE FROM map_cache_states;
  DELETE FROM map_cache_projects;

  INSERT INTO map_cache_countries (country_code, country_name, project_count, categories, centroid, refreshed_at)
  SELECT
    rc.country_code,
    MAX(rc.country_name),
    COUNT(p.id)::integer,
    (
      SELECT jsonb_object_agg(cat, cnt)
      FROM (
        SELECT p2.category::text AS cat, COUNT(*)::integer AS cnt
        FROM projects p2
        JOIN region_centroids rc2 ON p2.region_id = rc2.id
        WHERE p2.status = 'approved'
          AND rc2.country_code = rc.country_code
        GROUP BY p2.category
      ) sub
    ),
    (
      SELECT centroid
      FROM region_centroids
      WHERE country_code = rc.country_code
        AND geo_level = 'country'
      LIMIT 1
    ),
    now()
  FROM projects p
  JOIN region_centroids rc ON p.region_id = rc.id
  WHERE p.status = 'approved'
  GROUP BY rc.country_code;

  INSERT INTO map_cache_states (country_code, state_province, display_label, project_count, categories, centroid, refreshed_at)
  SELECT
    rc.country_code,
    COALESCE(rc.state_province, rc.country_name),
    COALESCE(
      (
        SELECT display_label
        FROM region_centroids
        WHERE country_code = rc.country_code
          AND state_province = rc.state_province
          AND geo_level = 'state'
        LIMIT 1
      ),
      rc.country_name
    ),
    COUNT(p.id)::integer,
    (
      SELECT jsonb_object_agg(cat, cnt)
      FROM (
        SELECT p2.category::text AS cat, COUNT(*)::integer AS cnt
        FROM projects p2
        JOIN region_centroids rc2 ON p2.region_id = rc2.id
        WHERE p2.status = 'approved'
          AND rc2.country_code = rc.country_code
          AND (
            rc2.state_province = rc.state_province
            OR (rc2.state_province IS NULL AND rc.state_province IS NULL)
          )
        GROUP BY p2.category
      ) sub
    ),
    COALESCE(
      (
        SELECT centroid
        FROM region_centroids
        WHERE country_code = rc.country_code
          AND state_province = rc.state_province
          AND geo_level = 'state'
        LIMIT 1
      ),
      (
        SELECT centroid
        FROM region_centroids
        WHERE country_code = rc.country_code
          AND geo_level = 'country'
        LIMIT 1
      )
    ),
    now()
  FROM projects p
  JOIN region_centroids rc ON p.region_id = rc.id
  WHERE p.status = 'approved'
    AND rc.state_province IS NOT NULL
  GROUP BY rc.country_code, rc.state_province, rc.country_name;

  INSERT INTO map_cache_projects (
    project_id, name, description, category, creator_first_name,
    display_label, image_url, external_link, display_point, refreshed_at
  )
  SELECT
    p.id,
    p.name,
    p.description,
    p.category,
    COALESCE(NULLIF(SPLIT_PART(m.full_name, ' ', 1), ''), 'Member'),
    CASE
      WHEN rc.country_code = 'AU' THEN
        COALESCE(
          (
            SELECT display_label
            FROM region_centroids
            WHERE country_code = rc.country_code
              AND state_province = rc.state_province
              AND geo_level = 'state'
            LIMIT 1
          ),
          rc.country_name
        )
      WHEN region_count >= min_per_region THEN rc.display_label
      WHEN rc.geo_level = 'city' AND region_count < min_per_region THEN
        COALESCE(
          (
            SELECT display_label
            FROM region_centroids
            WHERE country_code = rc.country_code
              AND state_province = rc.state_province
              AND geo_level = 'state'
            LIMIT 1
          ),
          rc.display_label
        )
      WHEN rc.geo_level = 'state' AND region_count < min_per_region THEN
        rc.country_name
      ELSE rc.display_label
    END,
    p.image_url,
    p.external_link,
    CASE
      WHEN rc.country_code = 'AU' THEN
        COALESCE(
          (
            SELECT centroid
            FROM region_centroids
            WHERE country_code = rc.country_code
              AND state_province = rc.state_province
              AND geo_level = 'state'
            LIMIT 1
          ),
          (
            SELECT centroid
            FROM region_centroids
            WHERE country_code = rc.country_code
              AND geo_level = 'country'
            LIMIT 1
          ),
          rc.centroid
        )
      WHEN region_count >= min_per_region THEN rc.centroid
      WHEN rc.geo_level = 'city' AND region_count < min_per_region THEN
        COALESCE(
          (
            SELECT centroid
            FROM region_centroids
            WHERE country_code = rc.country_code
              AND state_province = rc.state_province
              AND geo_level = 'state'
            LIMIT 1
          ),
          rc.centroid
        )
      WHEN rc.geo_level = 'state' AND region_count < min_per_region THEN
        COALESCE(
          (
            SELECT centroid
            FROM region_centroids
            WHERE country_code = rc.country_code
              AND geo_level = 'country'
            LIMIT 1
          ),
          rc.centroid
        )
      ELSE rc.centroid
    END,
    now()
  FROM projects p
  JOIN members m ON p.creator_id = m.id
  JOIN region_centroids rc ON p.region_id = rc.id
  CROSS JOIN LATERAL (
    SELECT COUNT(*)::integer AS region_count
    FROM projects p2
    WHERE p2.region_id = p.region_id
      AND p2.status = 'approved'
  ) counts
  WHERE p.status = 'approved';
END;
$$;
