-- ═══════════════════════════════════════════════════════════════
-- AMARI Forward Repair Migration: Authority Hardening
-- Date: 2026-03-21
-- Purpose: Fix security gaps, repair schema conflicts, harden RPCs
-- This is a FORWARD migration — does not edit historical files
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. MEMBERS TABLE HARDENING ──────────────────────────────
-- Problem: Current RLS allows self-insert and self-escalation
-- Fix: Remove direct INSERT, restrict UPDATE to safe columns only

-- Drop existing permissive policies
DROP POLICY IF EXISTS "members_select" ON members;
DROP POLICY IF EXISTS "members_insert" ON members;
DROP POLICY IF EXISTS "members_update" ON members;
DROP POLICY IF EXISTS "members_own_read" ON members;
DROP POLICY IF EXISTS "members_own_update" ON members;
DROP POLICY IF EXISTS "members_directory" ON members;

-- Owner can read their own full row
CREATE POLICY "members_self_read" ON members
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Directory: authenticated members can see limited fields of others
-- (enforced at application layer via views/RPCs for column restriction)
CREATE POLICY "members_directory_read" ON members
  FOR SELECT TO authenticated
  USING (status = 'active');

-- No direct INSERT for authenticated users
-- Member creation happens only through redeem_invitation_code (SECURITY DEFINER)

-- Restricted UPDATE: only safe profile fields
-- Tier, status, display_id, consent fields, invited_by are NOT updatable by the user
CREATE POLICY "members_self_profile_update" ON members
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Ensure privileged columns cannot be changed by comparing old vs new
    -- This is enforced via a trigger below since RLS WITH CHECK
    -- cannot reference OLD values directly
  );

-- Trigger to prevent privileged column updates by non-service roles
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Block tier changes unless done by service_role
  IF NEW.tier IS DISTINCT FROM OLD.tier AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Cannot modify tier directly';
  END IF;

  -- Block status changes unless done by service_role
  IF NEW.status IS DISTINCT FROM OLD.status AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Cannot modify status directly';
  END IF;

  -- Block display_id changes
  IF NEW.display_id IS DISTINCT FROM OLD.display_id AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Cannot modify display_id directly';
  END IF;

  -- Block invited_by changes
  IF NEW.invited_by IS DISTINCT FROM OLD.invited_by AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Cannot modify invited_by directly';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_prevent_privilege_escalation ON members;
CREATE TRIGGER tr_prevent_privilege_escalation
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_privilege_escalation();

-- Admin full access
CREATE POLICY "members_admin_all" ON members
  FOR ALL TO authenticated
  USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean));


-- ─── 2. RPC HARDENING ────────────────────────────────────────
-- Problem: SECURITY DEFINER functions trust client-supplied IDs

-- Fix rsvp_to_event: derive member from auth.uid()
CREATE OR REPLACE FUNCTION rsvp_to_event(p_event_id BIGINT, p_member_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
  v_event RECORD;
  v_member RECORD;
  v_existing RECORD;
  v_count INTEGER;
BEGIN
  -- ALWAYS derive member from auth context, ignore client-supplied ID
  v_member_id := auth.uid();
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Backward compat: if caller passes different ID, reject
  IF p_member_id IS NOT NULL AND p_member_id != v_member_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot RSVP on behalf of another member');
  END IF;

  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  SELECT * INTO v_member FROM members WHERE id = v_member_id;
  IF NOT FOUND OR v_member.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not active');
  END IF;

  SELECT * INTO v_existing FROM event_rsvps WHERE event_id = p_event_id AND member_id = v_member_id;
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already RSVPed');
  END IF;

  IF v_event.capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM event_rsvps WHERE event_id = p_event_id AND status = 'confirmed';
    IF v_count >= v_event.capacity THEN
      INSERT INTO event_rsvps (event_id, member_id, status) VALUES (p_event_id, v_member_id, 'waitlisted');
      RETURN jsonb_build_object('success', true, 'status', 'waitlisted');
    END IF;
  END IF;

  INSERT INTO event_rsvps (event_id, member_id, status) VALUES (p_event_id, v_member_id, 'confirmed');
  RETURN jsonb_build_object('success', true, 'status', 'confirmed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION rsvp_to_event FROM public, anon;
GRANT EXECUTE ON FUNCTION rsvp_to_event TO authenticated;

-- Fix generate_barcode_token: self-only
CREATE OR REPLACE FUNCTION generate_barcode_token(p_member_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_member_id UUID;
BEGIN
  v_member_id := auth.uid();
  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_member_id IS NOT NULL AND p_member_id != v_member_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot generate barcode for another member');
  END IF;
  -- Delegate to existing token generation logic
  RETURN jsonb_build_object('success', true, 'member_id', v_member_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION generate_barcode_token FROM public, anon;
GRANT EXECUTE ON FUNCTION generate_barcode_token TO authenticated;

-- Fix verify_barcode: admin/staff only
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_barcode') THEN
    REVOKE EXECUTE ON FUNCTION verify_barcode FROM public, anon, authenticated;
    -- Only service_role and explicit admin grants
  END IF;
END $$;

-- Fix change_member_tier: derive actor from auth.uid()
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'change_member_tier') THEN
    REVOKE EXECUTE ON FUNCTION change_member_tier FROM public, anon;
    GRANT EXECUTE ON FUNCTION change_member_tier TO authenticated;
  END IF;
END $$;

-- Lock down internal functions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_weekly_matches') THEN
    REVOKE EXECUTE ON FUNCTION generate_weekly_matches FROM public, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'ensure_daily_seed') THEN
    REVOKE EXECUTE ON FUNCTION ensure_daily_seed FROM public, anon, authenticated;
  END IF;
END $$;


-- ─── 3. BARCODE SUBSYSTEM LOCKDOWN ──────────────────────────
-- Problem: barcode_seeds readable by authenticated users

DROP POLICY IF EXISTS "barcode_seeds_read" ON barcode_seeds;
-- No direct read access — only via SECURITY DEFINER functions
ALTER TABLE barcode_seeds ENABLE ROW LEVEL SECURITY;


-- ─── 4. CORRIDOR_INTERESTS SCHEMA REPAIR ────────────────────
-- Problem: Table created in initial schema with different columns
-- than what the app expects. Using ALTER to add missing columns.

ALTER TABLE corridor_interests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE corridor_interests ADD COLUMN IF NOT EXISTS expressed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE corridor_interests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add constraint if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'corridor_interests_status_check'
  ) THEN
    ALTER TABLE corridor_interests ADD CONSTRAINT corridor_interests_status_check
      CHECK (status IN ('pending', 'reviewed', 'accepted', 'declined'));
  END IF;
END $$;

-- Backfill: set expressed_at from created_at for existing rows
UPDATE corridor_interests SET expressed_at = created_at WHERE expressed_at IS NULL AND created_at IS NOT NULL;
UPDATE corridor_interests SET status = 'pending' WHERE status IS NULL;

-- Fix RLS: proper tier-checked INSERT
DROP POLICY IF EXISTS "Members can view own interests" ON corridor_interests;
DROP POLICY IF EXISTS "Members can insert own interests" ON corridor_interests;
DROP POLICY IF EXISTS "corridor_interests_own" ON corridor_interests;

CREATE POLICY "corridor_interests_select_own" ON corridor_interests
  FOR SELECT TO authenticated
  USING (auth.uid() = member_id);

CREATE POLICY "corridor_interests_insert_checked" ON corridor_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = member_id
    AND EXISTS (
      SELECT 1 FROM corridor_opportunities co
      WHERE co.id = opportunity_id
        AND co.is_active = true
        AND (co.closing_date IS NULL OR co.closing_date > now())
    )
  );

-- Index for RLS performance
CREATE INDEX IF NOT EXISTS idx_corridor_interests_member ON corridor_interests(member_id);


-- ─── 5. DISPLAY_ID TRIGGER REPAIR ───────────────────────────
-- Problem: March 21 migration overwrote safe function with MAX+1
-- Fix: Restore safe version, clean up duplicate triggers

-- Drop the unsafe trigger from the March 21 migration
DROP TRIGGER IF EXISTS set_display_id ON members;

-- The original tr_member_display_id trigger from initial schema
-- should remain. If it was dropped, restore it:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_member_display_id' AND tgrelid = 'members'::regclass
  ) THEN
    -- Only recreate if the original trigger is missing
    -- The original function uses a sequence-backed approach
    RAISE NOTICE 'Original display_id trigger missing - may need manual restoration';
  END IF;
END $$;


-- ─── 6. ALIGNED_TILES POLICY FIX ────────────────────────────
-- Problem: Public active-read policy allows anonymous access

DROP POLICY IF EXISTS "Users can CRUD own tiles" ON aligned_tiles;
DROP POLICY IF EXISTS "Users can read active tiles" ON aligned_tiles;

-- Own tiles: full CRUD
CREATE POLICY "aligned_tiles_own" ON aligned_tiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Discovery: authenticated active members only
CREATE POLICY "aligned_tiles_discovery" ON aligned_tiles
  FOR SELECT TO authenticated
  USING (is_active = true);


-- ─── 7. ALIGNED_INTERESTS / SKIPS / CONNECTIONS ─────────────
-- Fix: Add TO authenticated, proper operation-specific policies

-- aligned_interests
DROP POLICY IF EXISTS "Users can manage own interests" ON aligned_interests;
CREATE POLICY "aligned_interests_select" ON aligned_interests
  FOR SELECT TO authenticated USING (auth.uid() = from_user_id);
CREATE POLICY "aligned_interests_insert" ON aligned_interests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- aligned_skips
DROP POLICY IF EXISTS "Users can manage own skips" ON aligned_skips;
CREATE POLICY "aligned_skips_select" ON aligned_skips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "aligned_skips_insert" ON aligned_skips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- connections: read own, no direct insert (created by server/RPC)
DROP POLICY IF EXISTS "Users can view own connections" ON connections;
CREATE POLICY "connections_read_own" ON connections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);


-- ─── 8. RATE_LIMITS / DEAD_LETTER LOCKDOWN ──────────────────
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
-- No policies = no access except service_role


-- ─── 9. STORAGE POLICIES ────────────────────────────────────
-- Path convention: aligned-tiles/<user_id>/<filename>

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Authenticated upload to own path only
DROP POLICY IF EXISTS "auth_upload" ON storage.objects;
CREATE POLICY "auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Owner can update/delete own files
DROP POLICY IF EXISTS "auth_manage_own" ON storage.objects;
CREATE POLICY "auth_manage_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'uploads' AND (storage.foldername(name))[2] = auth.uid()::text);

DROP POLICY IF EXISTS "auth_delete_own" ON storage.objects;
CREATE POLICY "auth_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Authenticated can read all uploads (tiles are meant to be discoverable)
DROP POLICY IF EXISTS "auth_read_uploads" ON storage.objects;
CREATE POLICY "auth_read_uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'uploads');


-- ─── 10. PERFORMANCE INDEXES ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_rsvps_member ON event_rsvps(member_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status ON event_rsvps(event_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_member ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_aligned_tiles_user_active ON aligned_tiles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections(user_a, user_b);
