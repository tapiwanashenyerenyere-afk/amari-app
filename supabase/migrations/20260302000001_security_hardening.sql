-- ============================================================
-- SECURITY HARDENING: hash-based code lookup, rate limiting,
-- drop anon SELECT policy, validate_invitation_code RPC
-- ============================================================

-- Ensure pgcrypto extension is available (for extensions.digest())
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- A) Add code_hash and code_prefix columns
-- ============================================================
ALTER TABLE invitation_codes
  ADD COLUMN IF NOT EXISTS code_hash text,
  ADD COLUMN IF NOT EXISTS code_prefix text;

-- ============================================================
-- B) Hash all existing 800 codes (SHA-256)
-- ============================================================
UPDATE invitation_codes
SET code_hash  = encode(extensions.digest(code, 'sha256'), 'hex'),
    code_prefix = substring(code, 1, 10)
WHERE code_hash IS NULL;

-- ============================================================
-- C) Index on code_hash for fast hash-based lookup (unused only)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invitation_codes_hash
  ON invitation_codes(code_hash)
  WHERE used_by IS NULL;

-- ============================================================
-- D) validate_invitation_code(p_code text) — SECURITY DEFINER
--    Rate-limited, hash-based lookup, returns ONLY {valid: bool}
--    No tier info leaked. Callable by anon (pre-signup).
-- ============================================================
CREATE OR REPLACE FUNCTION validate_invitation_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_exists boolean;
  v_allowed boolean;
BEGIN
  -- Rate limit: 5 attempts per 60 minutes per "IP"
  -- Since we're in a DB function without real IP, we use the
  -- requesting user's JWT sub (or 'anon' for unauthenticated).
  -- The check_rate_limit function handles counting + cleanup.
  v_allowed := check_rate_limit(
    coalesce(auth.uid()::text, 'anon'),
    'invite_validate',
    5,   -- max 5 requests
    60   -- per 60 minutes
  );

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('valid', false, 'error', 'rate_limited');
  END IF;

  -- Hash the input code (uppercase for case-insensitive matching)
  v_hash := encode(extensions.digest(upper(p_code), 'sha256'), 'hex');

  -- Check if an unused, non-expired code with this hash exists
  SELECT EXISTS (
    SELECT 1
    FROM invitation_codes
    WHERE code_hash = v_hash
      AND used_by IS NULL
      AND expires_at > now()
  ) INTO v_exists;

  -- Return ONLY validity — no tier, no code details
  RETURN jsonb_build_object('valid', v_exists);
END;
$$;

GRANT EXECUTE ON FUNCTION validate_invitation_code(text) TO anon, authenticated;

-- ============================================================
-- E) Replace redeem_invitation_code() — hash-based lookup
--    Keeps all existing logic, adds already_member guard
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_invitation_code(
  p_code text,
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_city text DEFAULT NULL,
  p_industry text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite invitation_codes%ROWTYPE;
  v_member_exists boolean;
  v_hash text;
BEGIN
  -- Check if member already exists BEFORE touching the code
  SELECT EXISTS (SELECT 1 FROM members WHERE id = p_user_id)
    INTO v_member_exists;

  IF v_member_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_member'
    );
  END IF;

  -- Hash the input code for lookup
  v_hash := encode(extensions.digest(upper(p_code), 'sha256'), 'hex');

  -- Lock the code row to prevent race conditions
  -- SKIP LOCKED: if another transaction has this row locked, return NOT FOUND immediately
  SELECT * INTO v_invite
  FROM invitation_codes
  WHERE code_hash = v_hash
    AND used_by IS NULL
    AND expires_at > now()
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_or_expired'
    );
  END IF;

  -- Mark code as used
  UPDATE invitation_codes
  SET used_by = p_user_id,
      used_at = now()
  WHERE id = v_invite.id;

  -- Create member with the tier from the code
  INSERT INTO members (id, full_name, email, tier, status, city, industry)
  VALUES (
    p_user_id,
    p_full_name,
    p_email,
    v_invite.tier_grant,
    'active',
    p_city,
    p_industry
  );

  -- If code grants admin, insert admin role
  IF v_invite.grants_admin THEN
    INSERT INTO admin_roles (member_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (member_id) DO NOTHING;
  END IF;

  -- Update auth.users app_metadata so JWT immediately reflects tier + is_admin
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'tier', v_invite.tier_grant::text,
      'is_admin', v_invite.grants_admin
    )
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'tier', v_invite.tier_grant::text,
    'is_admin', v_invite.grants_admin
  );
END;
$$;

-- Re-grant execute (CREATE OR REPLACE preserves grants, but be explicit)
GRANT EXECUTE ON FUNCTION redeem_invitation_code(text, uuid, text, text, text, text) TO authenticated;

-- ============================================================
-- F) Drop the anon SELECT policy — codes are no longer
--    directly queryable. All validation goes through the RPC.
-- ============================================================
DROP POLICY IF EXISTS "invitation_codes_validate" ON invitation_codes;

-- The admin policy "invitation_codes_admin_all" remains intact.

-- ============================================================
-- G) Update rate_limits cleanup to cover invite_validate entries
--    The existing cleanup runs every 15 min and deletes rows
--    older than 15 min. We replace it with a 24h window so
--    invite_validate entries (1-hour window) are properly counted.
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM rate_limits WHERE created_at < now() - INTERVAL '24 hours';
$$;

-- The existing cron job ('cleanup-rate-limits', every 15 min) will
-- now use the updated function with the 24h window automatically.
