-- Events and Pulse policy hardening
-- 1. Events remain visible to all active members; only the registration action is tier-gated.
-- 2. Pulse content access is enforced server-side through tier-aware RPCs.
-- 3. Map refresh cache execution is restricted to service role usage.

DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select"
  ON public.events
  FOR SELECT
  TO authenticated
  USING ((SELECT is_active_member()));

DROP POLICY IF EXISTS "pulse_select" ON public.pulse_editions;

CREATE OR REPLACE FUNCTION public.get_pulse_feed(p_limit integer DEFAULT 8)
RETURNS SETOF public.pulse_editions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier membership_tier;
BEGIN
  IF NOT is_active_member() THEN
    RETURN;
  END IF;

  v_tier := get_member_tier();

  RETURN QUERY
  SELECT
    pe.id,
    pe.publish_date,
    pe.status,
    pe.headline,
    CASE WHEN tier_level(v_tier) >= 2 THEN pe.summary_content ELSE NULL END,
    CASE WHEN tier_level(v_tier) >= 3 THEN pe.full_content ELSE NULL END,
    pe.stats,
    pe.hero_image_path,
    pe.created_at,
    pe.updated_at
  FROM public.pulse_editions AS pe
  WHERE pe.status IN ('published', 'archived')
  ORDER BY pe.publish_date DESC
  LIMIT GREATEST(COALESCE(p_limit, 8), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pulse_edition(p_id integer)
RETURNS SETOF public.pulse_editions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier membership_tier;
BEGIN
  IF NOT is_active_member() THEN
    RETURN;
  END IF;

  v_tier := get_member_tier();

  RETURN QUERY
  SELECT
    pe.id,
    pe.publish_date,
    pe.status,
    pe.headline,
    CASE WHEN tier_level(v_tier) >= 2 THEN pe.summary_content ELSE NULL END,
    CASE WHEN tier_level(v_tier) >= 3 THEN pe.full_content ELSE NULL END,
    pe.stats,
    pe.hero_image_path,
    pe.created_at,
    pe.updated_at
  FROM public.pulse_editions AS pe
  WHERE pe.id = p_id
    AND pe.status IN ('published', 'archived');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pulse_feed(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pulse_edition(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.refresh_map_cache() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_map_cache() FROM anon;
REVOKE ALL ON FUNCTION public.refresh_map_cache() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_map_cache() TO service_role;
