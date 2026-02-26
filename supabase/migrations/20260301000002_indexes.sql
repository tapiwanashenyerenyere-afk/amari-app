-- ============================================================
-- INDEXES — every RLS subquery and common query path
-- ============================================================

CREATE INDEX idx_members_status ON members(id, status);
CREATE INDEX idx_members_tier ON members(tier);
CREATE INDEX idx_members_city ON members(city) WHERE status = 'active';
CREATE INDEX idx_members_industry ON members(industry) WHERE status = 'active';

CREATE INDEX idx_events_type_tier ON events(type, min_tier);
CREATE INDEX idx_events_starts_at ON events(starts_at);

CREATE INDEX idx_event_rsvps_event_status ON event_rsvps(event_id, status);
CREATE INDEX idx_event_rsvps_member ON event_rsvps(member_id);
CREATE INDEX idx_event_rsvps_checkin ON event_rsvps(event_id) WHERE checked_in_at IS NULL;

CREATE INDEX idx_corridor_tier_active ON corridor_opportunities(min_tier) WHERE is_active = true;
CREATE INDEX idx_corridor_closing ON corridor_opportunities(closing_date) WHERE is_active = true;

CREATE INDEX idx_aligned_member_a ON aligned_matches(member_a, week_of);
CREATE INDEX idx_aligned_member_b ON aligned_matches(member_b, week_of);
CREATE INDEX idx_aligned_stage ON aligned_matches(stage) WHERE stage IN ('new', 'accepted');
CREATE INDEX idx_aligned_history ON aligned_history(member_a, member_b);

CREATE INDEX idx_city_presence_active ON city_presence(city) WHERE is_active = true;

CREATE INDEX idx_notifications_member ON notifications(member_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(member_id) WHERE read_at IS NULL;

CREATE INDEX idx_rate_limits_cleanup ON rate_limits(created_at);
CREATE INDEX idx_rate_limits_check ON rate_limits(ip_address, endpoint, created_at);

CREATE INDEX idx_pulse_published ON pulse_editions(publish_date DESC) WHERE status = 'published';
CREATE INDEX idx_admin_roles_member ON admin_roles(member_id);
CREATE INDEX idx_barcode_revocations_member ON barcode_revocations(member_id);
