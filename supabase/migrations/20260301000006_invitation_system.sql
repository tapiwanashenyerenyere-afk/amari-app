-- ============================================================
-- INVITATION SYSTEM: RLS fixes, redeem function, 800 codes
-- ============================================================

-- A) Add grants_admin column to invitation_codes
ALTER TABLE invitation_codes
  ADD COLUMN IF NOT EXISTS grants_admin boolean NOT NULL DEFAULT false;

-- B) Indexes for fast code validation
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code
  ON invitation_codes(code)
  WHERE used_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_invitation_codes_tier
  ON invitation_codes(tier_grant, grants_admin);

-- C) RLS Policies for invitation_codes
-- Allow anyone (anon or authenticated) to validate unused, non-expired codes
-- This is needed because the user has NOT signed up yet when they enter a code
CREATE POLICY "invitation_codes_validate"
  ON invitation_codes
  FOR SELECT
  TO anon, authenticated
  USING (
    used_by IS NULL
    AND expires_at > now()
  );

-- Admins can see and manage all codes
CREATE POLICY "invitation_codes_admin_all"
  ON invitation_codes
  FOR ALL
  TO authenticated
  USING ((SELECT is_admin()));

-- D) Redeem invitation code function (SECURITY DEFINER)
-- Atomically: validate code, mark used, create member, grant admin if applicable
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
BEGIN
  -- Lock the code row to prevent race conditions
  -- SKIP LOCKED: if another transaction has this row locked, return NOT FOUND immediately
  SELECT * INTO v_invite
  FROM invitation_codes
  WHERE code = upper(p_code)
    AND used_by IS NULL
    AND expires_at > now()
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid, expired, or already used invitation code'
    );
  END IF;

  -- Check if member already exists (idempotency guard)
  SELECT EXISTS (SELECT 1 FROM members WHERE id = p_user_id)
    INTO v_member_exists;

  IF v_member_exists THEN
    -- Member already created (e.g. duplicate call) — still mark code as used
    UPDATE invitation_codes
    SET used_by = p_user_id, used_at = now()
    WHERE id = v_invite.id AND used_by IS NULL;

    RETURN jsonb_build_object(
      'success', true,
      'tier', v_invite.tier_grant::text,
      'is_admin', v_invite.grants_admin,
      'already_exists', true
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
    'is_admin', v_invite.grants_admin,
    'already_exists', false
  );
END;
$$;

-- Grant execute to authenticated users (must have signed up first)
GRANT EXECUTE ON FUNCTION redeem_invitation_code(text, uuid, text, text, text, text) TO authenticated;

-- E) Remove old test codes
DELETE FROM invitation_codes
WHERE code IN ('AMARI-TEST-001', 'AMARI-SILVER-001', 'AMARI-PLAT-001', 'AMARI-LAUR-001');

-- ============================================================
-- GENERATE 800 INVITATION CODES
-- Expiration: 1 year from deployment
-- ============================================================

-- 6 Admin/Owner codes: laureate tier + admin access
INSERT INTO invitation_codes (code, tier_grant, grants_admin, expires_at)
SELECT
  'AMARI-ADM-' || lpad(n::text, 3, '0'),
  'laureate'::membership_tier,
  true,
  now() + interval '1 year'
FROM generate_series(1, 6) AS n;

-- 20 Board/Judge codes: platinum tier
INSERT INTO invitation_codes (code, tier_grant, grants_admin, expires_at)
SELECT
  'AMARI-BRD-' || lpad(n::text, 3, '0'),
  'platinum'::membership_tier,
  false,
  now() + interval '1 year'
FROM generate_series(1, 20) AS n;

-- 200 Elite codes (Nominees, Winners, Partners): silver tier
INSERT INTO invitation_codes (code, tier_grant, grants_admin, expires_at)
SELECT
  'AMARI-ELT-' || lpad(n::text, 3, '0'),
  'silver'::membership_tier,
  false,
  now() + interval '1 year'
FROM generate_series(1, 200) AS n;

-- 574 Member codes: general membership
INSERT INTO invitation_codes (code, tier_grant, grants_admin, expires_at)
SELECT
  'AMARI-MBR-' || lpad(n::text, 3, '0'),
  'member'::membership_tier,
  false,
  now() + interval '1 year'
FROM generate_series(1, 574) AS n;
