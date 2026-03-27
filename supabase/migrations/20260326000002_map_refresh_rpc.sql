-- ═══════════════════════════════════════════════════════════════
-- Map Refresh RPC — Server-side cache population with PostGIS
-- Called by the refresh-map-data Edge Function or pg_cron
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION refresh_map_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  min_per_region integer := 3;
BEGIN
  -- ─── 1. Clear caches ──────────────────────────────────
  DELETE FROM map_cache_countries;
  DELETE FROM map_cache_states;
  DELETE FROM map_cache_projects;

  -- ─── 2. Populate country-level aggregates ─────────────
  INSERT INTO map_cache_countries (country_code, country_name, project_count, categories, centroid, refreshed_at)
  SELECT
    rc.country_code,
    rc.country_name,
    COUNT(p.id)::integer as project_count,
    jsonb_object_agg(
      p.category::text,
      cat_counts.cnt
    ) as categories,
    (SELECT centroid FROM region_centroids
     WHERE country_code = rc.country_code AND geo_level = 'country'
     LIMIT 1
    ) as centroid,
    now() as refreshed_at
  FROM projects p
  JOIN region_centroids rc ON p.region_id = rc.id
  CROSS JOIN LATERAL (
    SELECT p.category, COUNT(*)::integer as cnt
    FROM projects p2
    JOIN region_centroids rc2 ON p2.region_id = rc2.id
    WHERE p2.status = 'approved' AND rc2.country_code = rc.country_code
    GROUP BY p2.category
  ) cat_counts
  WHERE p.status = 'approved'
  GROUP BY rc.country_code, rc.country_name, cat_counts.cnt, p.category
  ON CONFLICT DO NOTHING;

  -- Simplified: just aggregate by country
  DELETE FROM map_cache_countries;
  INSERT INTO map_cache_countries (country_code, country_name, project_count, categories, centroid, refreshed_at)
  SELECT
    rc.country_code,
    MAX(rc.country_name),
    COUNT(p.id)::integer,
    (
      SELECT jsonb_object_agg(cat, cnt)
      FROM (
        SELECT p2.category::text as cat, COUNT(*)::integer as cnt
        FROM projects p2
        JOIN region_centroids rc2 ON p2.region_id = rc2.id
        WHERE p2.status = 'approved' AND rc2.country_code = rc.country_code
        GROUP BY p2.category
      ) sub
    ),
    (SELECT centroid FROM region_centroids
     WHERE country_code = rc.country_code AND geo_level = 'country'
     LIMIT 1),
    now()
  FROM projects p
  JOIN region_centroids rc ON p.region_id = rc.id
  WHERE p.status = 'approved'
  GROUP BY rc.country_code;

  -- ─── 3. Populate state-level aggregates ────────────────
  INSERT INTO map_cache_states (country_code, state_province, display_label, project_count, categories, centroid, refreshed_at)
  SELECT
    rc.country_code,
    COALESCE(rc.state_province, rc.country_name),
    COALESCE(
      (SELECT display_label FROM region_centroids
       WHERE country_code = rc.country_code
         AND state_province = rc.state_province
         AND geo_level = 'state'
       LIMIT 1),
      rc.country_name
    ),
    COUNT(p.id)::integer,
    (
      SELECT jsonb_object_agg(cat, cnt)
      FROM (
        SELECT p2.category::text as cat, COUNT(*)::integer as cnt
        FROM projects p2
        JOIN region_centroids rc2 ON p2.region_id = rc2.id
        WHERE p2.status = 'approved'
          AND rc2.country_code = rc.country_code
          AND (rc2.state_province = rc.state_province OR (rc2.state_province IS NULL AND rc.state_province IS NULL))
        GROUP BY p2.category
      ) sub
    ),
    COALESCE(
      (SELECT centroid FROM region_centroids
       WHERE country_code = rc.country_code
         AND state_province = rc.state_province
         AND geo_level = 'state'
       LIMIT 1),
      (SELECT centroid FROM region_centroids
       WHERE country_code = rc.country_code
         AND geo_level = 'country'
       LIMIT 1)
    ),
    now()
  FROM projects p
  JOIN region_centroids rc ON p.region_id = rc.id
  WHERE p.status = 'approved'
    AND rc.state_province IS NOT NULL
  GROUP BY rc.country_code, rc.state_province, rc.country_name;

  -- ─── 4. Populate project cache with privacy degradation ─
  -- Projects in regions with >= min_per_region get their actual centroid
  -- Projects in smaller regions get degraded to state or country centroid
  INSERT INTO map_cache_projects (
    project_id, name, description, category, creator_first_name,
    display_label, image_url, external_link, display_point, refreshed_at
  )
  SELECT
    p.id,
    p.name,
    p.description,
    p.category,
    SPLIT_PART(m.full_name, ' ', 1),
    CASE
      -- If region has enough projects, use the region's display label
      WHEN region_count >= min_per_region THEN rc.display_label
      -- If city with too few, use state label
      WHEN rc.geo_level = 'city' AND region_count < min_per_region THEN
        COALESCE(
          (SELECT display_label FROM region_centroids
           WHERE country_code = rc.country_code
             AND state_province = rc.state_province
             AND geo_level = 'state'
           LIMIT 1),
          rc.display_label
        )
      -- If state with too few, use country label
      WHEN rc.geo_level = 'state' AND region_count < min_per_region THEN
        rc.country_name
      ELSE rc.display_label
    END,
    p.image_url,
    p.external_link,
    -- Privacy-degraded centroid
    CASE
      WHEN region_count >= min_per_region THEN rc.centroid
      WHEN rc.geo_level = 'city' AND region_count < min_per_region THEN
        COALESCE(
          (SELECT centroid FROM region_centroids
           WHERE country_code = rc.country_code
             AND state_province = rc.state_province
             AND geo_level = 'state'
           LIMIT 1),
          rc.centroid
        )
      WHEN rc.geo_level = 'state' AND region_count < min_per_region THEN
        COALESCE(
          (SELECT centroid FROM region_centroids
           WHERE country_code = rc.country_code
             AND geo_level = 'country'
           LIMIT 1),
          rc.centroid
        )
      ELSE rc.centroid
    END,
    now()
  FROM projects p
  JOIN members m ON p.creator_id = m.id
  JOIN region_centroids rc ON p.region_id = rc.id
  CROSS JOIN LATERAL (
    SELECT COUNT(*)::integer as region_count
    FROM projects p2
    WHERE p2.region_id = p.region_id AND p2.status = 'approved'
  ) counts
  WHERE p.status = 'approved';

END;
$$;

-- ─── Schedule weekly refresh (Monday 00:00 AEST = Sunday 14:00 UTC) ──
-- Requires pg_cron extension (enabled by default on Supabase)
-- SELECT cron.schedule(
--   'weekly-map-refresh',
--   '0 14 * * 0',  -- Sunday 14:00 UTC = Monday 00:00 AEST
--   $$SELECT refresh_map_cache()$$
-- );
-- NOTE: Uncomment the above after verifying the function works correctly
