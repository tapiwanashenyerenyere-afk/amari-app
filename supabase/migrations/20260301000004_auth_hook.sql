-- ============================================================
-- CUSTOM ACCESS TOKEN HOOK
-- Injects tier + admin status into JWT for fast RLS evaluation
-- ============================================================

CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims jsonb;
  v_tier text;
  v_is_admin boolean;
  v_user_id uuid;
BEGIN
  v_user_id := (event ->> 'user_id')::uuid;
  claims := event -> 'claims';

  SELECT tier::text INTO v_tier FROM members WHERE id = v_user_id AND status = 'active';
  SELECT EXISTS (SELECT 1 FROM admin_roles WHERE member_id = v_user_id) INTO v_is_admin;

  claims := jsonb_set(
    claims,
    '{app_metadata}',
    COALESCE(claims -> 'app_metadata', '{}'::jsonb) ||
    jsonb_build_object('tier', COALESCE(v_tier, 'member'), 'is_admin', COALESCE(v_is_admin, false))
  );

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION custom_access_token_hook FROM authenticated, anon, public;
GRANT SELECT ON TABLE members TO supabase_auth_admin;
GRANT SELECT ON TABLE admin_roles TO supabase_auth_admin;
