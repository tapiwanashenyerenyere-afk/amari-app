-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE aligned_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE aligned_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE aligned_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_seeds ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_member_tier()
RETURNS membership_tier LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v_tier membership_tier;
BEGIN
  BEGIN
    v_tier := (auth.jwt() -> 'app_metadata' ->> 'tier')::membership_tier;
    IF v_tier IS NOT NULL THEN RETURN v_tier; END IF;
  EXCEPTION WHEN OTHERS THEN END;
  SELECT tier INTO v_tier FROM members WHERE id = auth.uid() AND status = 'active';
  RETURN COALESCE(v_tier, 'member'::membership_tier);
END;
$$;

CREATE OR REPLACE FUNCTION is_active_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM admin_roles WHERE member_id = auth.uid());
$$;

-- MEMBERS
CREATE POLICY "members_own_profile_select" ON members FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "members_own_profile_update" ON members FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "members_directory_select" ON members FOR SELECT TO authenticated USING (status = 'active' AND (SELECT is_active_member()) AND tier_level((SELECT get_member_tier())) >= 1);
CREATE POLICY "members_admin_all" ON members FOR ALL TO authenticated USING ((SELECT is_admin()));
CREATE POLICY "members_insert" ON members FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- TIER CHANGES
CREATE POLICY "tier_changes_admin_insert" ON tier_changes FOR INSERT TO authenticated WITH CHECK ((SELECT is_admin()));
CREATE POLICY "tier_changes_admin_select" ON tier_changes FOR SELECT TO authenticated USING ((SELECT is_admin()));
CREATE POLICY "tier_changes_own_select" ON tier_changes FOR SELECT TO authenticated USING (member_id = auth.uid());

-- PULSE
CREATE POLICY "pulse_select" ON pulse_editions FOR SELECT TO authenticated USING (status = 'published' AND (SELECT is_active_member()));
CREATE POLICY "pulse_admin" ON pulse_editions FOR ALL TO authenticated USING ((SELECT is_admin()));

-- EVENTS
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated USING ((SELECT is_active_member()) AND tier_level((SELECT get_member_tier())) >= tier_level(min_tier));
CREATE POLICY "events_admin" ON events FOR ALL TO authenticated USING ((SELECT is_admin()));

-- EVENT RSVPs
CREATE POLICY "rsvps_own_select" ON event_rsvps FOR SELECT TO authenticated USING (member_id = auth.uid());
CREATE POLICY "rsvps_admin" ON event_rsvps FOR ALL TO authenticated USING ((SELECT is_admin()));

-- CORRIDOR
CREATE POLICY "corridor_select" ON corridor_opportunities FOR SELECT TO authenticated USING (is_active AND (SELECT is_active_member()) AND tier_level((SELECT get_member_tier())) >= tier_level(min_tier));
CREATE POLICY "corridor_admin" ON corridor_opportunities FOR ALL TO authenticated USING ((SELECT is_admin()));
CREATE POLICY "corridor_interests_own" ON corridor_interests FOR ALL TO authenticated USING (member_id = auth.uid()) WITH CHECK (member_id = auth.uid());
CREATE POLICY "corridor_interests_admin" ON corridor_interests FOR SELECT TO authenticated USING ((SELECT is_admin()));

-- ALIGNED
CREATE POLICY "aligned_own_select" ON aligned_matches FOR SELECT TO authenticated USING ((member_a = auth.uid() OR member_b = auth.uid()) AND (SELECT is_active_member()));
CREATE POLICY "aligned_admin" ON aligned_matches FOR ALL TO authenticated USING ((SELECT is_admin()));

-- CITY PRESENCE
CREATE POLICY "city_presence_own" ON city_presence FOR ALL TO authenticated USING (member_id = auth.uid()) WITH CHECK (member_id = auth.uid());
CREATE POLICY "city_presence_directory" ON city_presence FOR SELECT TO authenticated USING (is_active AND (SELECT is_active_member()) AND tier_level((SELECT get_member_tier())) >= 2);

-- NOTIFICATIONS
CREATE POLICY "notifications_own" ON notifications FOR SELECT TO authenticated USING (member_id = auth.uid());
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE TO authenticated USING (member_id = auth.uid()) WITH CHECK (member_id = auth.uid());

-- ADMIN ROLES
CREATE POLICY "admin_roles_select" ON admin_roles FOR SELECT TO authenticated USING ((SELECT is_admin()) OR member_id = auth.uid());

-- BARCODE
CREATE POLICY "barcode_revocations_admin" ON barcode_revocations FOR ALL TO authenticated USING ((SELECT is_admin()));
CREATE POLICY "barcode_seeds_service" ON barcode_seeds FOR SELECT TO authenticated USING (date_bucket = CURRENT_DATE);
