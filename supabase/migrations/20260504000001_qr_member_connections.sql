-- Allow members to connect by scanning another member's rotating AMARI pass.
-- The existing verify_barcode RPC remains admin-only for event check-in.

ALTER TABLE public.connections
  DROP CONSTRAINT IF EXISTS connections_matched_via_check;

ALTER TABLE public.connections
  ADD CONSTRAINT connections_matched_via_check
  CHECK (matched_via IN ('project', 'interest', 'pass'));

CREATE OR REPLACE FUNCTION public.connect_with_member_barcode(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $fn$
DECLARE
  v_actor uuid := auth.uid();
  v_parts text[];
  v_target_id uuid;
  v_date_bucket date;
  v_provided_hmac text;
  v_expected_hmac text;
  v_seed text;
  v_actor_active boolean;
  v_target public.members%rowtype;
  v_revoked boolean;
  v_connection public.connections%rowtype;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pass token found');
  END IF;

  v_parts := string_to_array(trim(p_token), ':');
  IF array_length(v_parts, 1) <> 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid pass format');
  END IF;

  BEGIN
    v_target_id := v_parts[1]::uuid;
    v_date_bucket := v_parts[2]::date;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid pass format');
  END;

  v_provided_hmac := lower(v_parts[3]);
  IF v_provided_hmac !~ '^[0-9a-f]{16}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid pass signature');
  END IF;

  IF v_target_id = v_actor THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot scan your own pass');
  END IF;

  IF v_date_bucket < current_date - interval '4 hours' OR v_date_bucket > current_date THEN
    RETURN jsonb_build_object('success', false, 'error', 'This pass has expired');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.members WHERE id = v_actor AND status = 'active'
  ) INTO v_actor_active;

  IF NOT v_actor_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your membership is not active');
  END IF;

  SELECT seed INTO v_seed
  FROM public.barcode_seeds
  WHERE date_bucket = v_date_bucket;

  IF v_seed IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This pass could not be verified');
  END IF;

  v_expected_hmac := encode(extensions.hmac(v_target_id::text || ':' || v_date_bucket::text, v_seed, 'sha256'), 'hex');
  IF left(v_expected_hmac, 16) <> v_provided_hmac THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid pass signature');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.barcode_revocations WHERE member_id = v_target_id
  ) INTO v_revoked;

  IF v_revoked THEN
    RETURN jsonb_build_object('success', false, 'error', 'This pass has been revoked');
  END IF;

  SELECT * INTO v_target
  FROM public.members
  WHERE id = v_target_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found or inactive');
  END IF;

  SELECT * INTO v_connection
  FROM public.connections
  WHERE status = 'mutual'
    AND (
      (user_a = v_actor AND user_b = v_target_id)
      OR
      (user_a = v_target_id AND user_b = v_actor)
    )
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_connected', true,
      'connection_id', v_connection.id,
      'name', v_target.full_name,
      'display_id', v_target.display_id
    );
  END IF;

  INSERT INTO public.connections (user_a, user_b, matched_via, status)
  VALUES (v_actor, v_target_id, 'pass', 'mutual')
  RETURNING * INTO v_connection;

  RETURN jsonb_build_object(
    'success', true,
    'already_connected', false,
    'connection_id', v_connection.id,
    'name', v_target.full_name,
    'display_id', v_target.display_id
  );
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.connect_with_member_barcode(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.connect_with_member_barcode(text) TO authenticated;
