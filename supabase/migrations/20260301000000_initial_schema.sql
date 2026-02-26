-- ============================================================
-- AMARI DATABASE SCHEMA V2
-- Fixes: write storm, race condition, display ID leak, audit log
-- ============================================================

-- Enum types
CREATE TYPE membership_tier AS ENUM ('member', 'silver', 'platinum', 'laureate');
CREATE TYPE member_status AS ENUM ('pending', 'active', 'suspended', 'inactive');
CREATE TYPE event_type AS ENUM ('vibes', 'dinner', 'talk', 'gala');
CREATE TYPE rsvp_status AS ENUM ('confirmed', 'waitlisted', 'cancelled');
CREATE TYPE opportunity_type AS ENUM ('co_invest', 'board', 'speaking', 'procurement', 'advisory');
CREATE TYPE aligned_stage AS ENUM ('new', 'accepted', 'revealed', 'expired', 'declined');
CREATE TYPE notification_type AS ENUM ('pulse', 'aligned', 'event', 'tier_change', 'system');

-- Helper: tier level as integer for comparisons
CREATE OR REPLACE FUNCTION tier_level(t membership_tier)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE t
    WHEN 'member' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'platinum' THEN 3
    WHEN 'laureate' THEN 4
  END;
$$;

-- ============================================================
-- MEMBERS
-- ============================================================
CREATE TABLE members (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_id    text UNIQUE NOT NULL,
  tier          membership_tier NOT NULL DEFAULT 'member',
  status        member_status NOT NULL DEFAULT 'pending',
  full_name     text NOT NULL,
  email         text NOT NULL,
  photo_url     text,
  bio           text,
  industry      text,
  city          text,
  company       text,
  title         text,
  consent_given_at    timestamptz,
  consent_version     text,
  deletion_requested_at timestamptz,
  expo_push_token text,
  notification_preferences jsonb DEFAULT '{"pulse": true, "aligned": true, "events": true}'::jsonb,
  onboarded_at  timestamptz,
  invited_by    uuid REFERENCES members(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Non-sequential display ID generator using Feistel cipher
CREATE SEQUENCE member_display_id_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_display_id()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  seq_val bigint;
  cipher_val bigint;
  year_str text;
  encoded text;
  key1 constant bigint := 47293;
  key2 constant bigint := 83461;
  rounds constant int := 3;
  half_bits constant int := 16;
  max_half constant bigint := 65536;
  l bigint;
  r bigint;
  tmp bigint;
BEGIN
  seq_val := nextval('member_display_id_seq');
  l := seq_val / max_half;
  r := seq_val % max_half;
  FOR i IN 1..rounds LOOP
    tmp := r;
    r := l # ((r * key1 + key2 + i) % max_half);
    l := tmp;
  END LOOP;
  cipher_val := l * max_half + r;
  year_str := to_char(now(), 'YYYY');
  encoded := upper(lpad(to_hex(cipher_val::int), 4, '0'));
  RETURN 'AMARI-' || year_str || '-' || encoded;
END;
$$;

CREATE OR REPLACE FUNCTION set_member_display_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := generate_display_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_member_display_id
  BEFORE INSERT ON members
  FOR EACH ROW EXECUTE FUNCTION set_member_display_id();

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_members_updated
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- TIER CHANGE AUDIT LOG (append-only)
-- ============================================================
CREATE TABLE tier_changes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id   uuid NOT NULL REFERENCES members(id),
  old_tier    membership_tier NOT NULL,
  new_tier    membership_tier NOT NULL,
  changed_by  uuid NOT NULL REFERENCES members(id),
  reason      text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- INVITATION CODES
-- ============================================================
CREATE TABLE invitation_codes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text UNIQUE NOT NULL,
  created_by  uuid REFERENCES members(id),
  used_by     uuid REFERENCES members(id),
  tier_grant  membership_tier DEFAULT 'member',
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- WEEKLY PULSE
-- ============================================================
CREATE TABLE pulse_editions (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  publish_date    date NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  headline        text NOT NULL,
  summary_content jsonb,
  full_content    jsonb NOT NULL,
  stats           jsonb DEFAULT '{}'::jsonb,
  hero_image_path text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER tr_pulse_updated
  BEFORE UPDATE ON pulse_editions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type            event_type NOT NULL,
  title           text NOT NULL,
  description     text,
  min_tier        membership_tier NOT NULL DEFAULT 'member',
  capacity        int,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  early_access_at timestamptz,
  general_access_at timestamptz,
  venue_name      text,
  venue_address   text,
  venue_lat       double precision,
  venue_lng       double precision,
  eventbrite_id   text,
  cover_image_path text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER tr_events_updated
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- EVENT RSVPs (atomic capacity management)
-- ============================================================
CREATE TABLE event_rsvps (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id        bigint NOT NULL REFERENCES events(id),
  member_id       uuid NOT NULL REFERENCES members(id),
  status          rsvp_status NOT NULL DEFAULT 'confirmed',
  checked_in_at   timestamptz,
  checked_in_by   uuid REFERENCES members(id),
  eventbrite_attendee_id text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (event_id, member_id)
);

-- ============================================================
-- ATOMIC RSVP FUNCTION (fixes race condition)
-- ============================================================
CREATE OR REPLACE FUNCTION rsvp_to_event(p_event_id bigint, p_member_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_event events%ROWTYPE;
  v_member members%ROWTYPE;
  v_current_count int;
  v_status rsvp_status;
BEGIN
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  SELECT * INTO v_member FROM members WHERE id = p_member_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found or inactive');
  END IF;

  IF tier_level(v_member.tier) < tier_level(v_event.min_tier) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tier too low for this event');
  END IF;

  IF v_event.early_access_at IS NOT NULL AND now() < v_event.early_access_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'RSVPs not yet open');
  END IF;

  IF v_event.general_access_at IS NOT NULL
     AND now() < v_event.general_access_at
     AND tier_level(v_member.tier) < 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Early access for Platinum+ only');
  END IF;

  IF EXISTS (SELECT 1 FROM event_rsvps WHERE event_id = p_event_id AND member_id = p_member_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already RSVPd');
  END IF;

  IF v_event.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_current_count
    FROM event_rsvps
    WHERE event_id = p_event_id AND status = 'confirmed';

    IF v_current_count >= v_event.capacity THEN
      v_status := 'waitlisted';
    ELSE
      v_status := 'confirmed';
    END IF;
  ELSE
    v_status := 'confirmed';
  END IF;

  INSERT INTO event_rsvps (event_id, member_id, status)
  VALUES (p_event_id, p_member_id, v_status);

  RETURN jsonb_build_object(
    'success', true,
    'status', v_status::text,
    'event_title', v_event.title
  );
END;
$$;

-- ============================================================
-- BARCODE VERIFICATION (no token storage — computed via HMAC)
-- ============================================================
CREATE TABLE barcode_revocations (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id   uuid NOT NULL REFERENCES members(id),
  reason      text NOT NULL,
  revoked_at  timestamptz DEFAULT now(),
  revoked_by  uuid REFERENCES members(id)
);

CREATE TABLE barcode_seeds (
  date_bucket   date PRIMARY KEY DEFAULT CURRENT_DATE,
  seed          text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at    timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION ensure_daily_seed()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_seed text;
BEGIN
  INSERT INTO barcode_seeds (date_bucket) VALUES (CURRENT_DATE)
  ON CONFLICT (date_bucket) DO NOTHING;
  SELECT seed INTO v_seed FROM barcode_seeds WHERE date_bucket = CURRENT_DATE;
  RETURN v_seed;
END;
$$;

CREATE OR REPLACE FUNCTION generate_barcode_token(p_member_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_seed text; v_hmac text; v_token text;
BEGIN
  v_seed := ensure_daily_seed();
  v_hmac := left(encode(
    hmac(p_member_id::text || ':' || CURRENT_DATE::text, v_seed, 'sha256'),
    'hex'
  ), 16);
  v_token := p_member_id::text || ':' || CURRENT_DATE::text || ':' || v_hmac;
  RETURN jsonb_build_object(
    'token', v_token,
    'expires_at', (CURRENT_DATE + INTERVAL '1 day 4 hours')::text
  );
END;
$$;

CREATE OR REPLACE FUNCTION verify_barcode(p_token text, p_event_id bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parts text[];
  v_member_id uuid;
  v_date_bucket date;
  v_provided_hmac text;
  v_expected_hmac text;
  v_seed text;
  v_member members%ROWTYPE;
  v_rsvp event_rsvps%ROWTYPE;
  v_revoked boolean;
BEGIN
  v_parts := string_to_array(p_token, ':');
  IF array_length(v_parts, 1) != 3 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid token format');
  END IF;

  v_member_id := v_parts[1]::uuid;
  v_date_bucket := v_parts[2]::date;
  v_provided_hmac := v_parts[3];

  IF v_date_bucket < CURRENT_DATE - INTERVAL '4 hours' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Token expired');
  END IF;

  SELECT seed INTO v_seed FROM barcode_seeds WHERE date_bucket = v_date_bucket;
  IF v_seed IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid date bucket');
  END IF;

  v_expected_hmac := encode(
    hmac(v_member_id::text || ':' || v_date_bucket::text, v_seed, 'sha256'),
    'hex'
  );

  IF left(v_expected_hmac, 16) != v_provided_hmac THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid signature');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM barcode_revocations WHERE member_id = v_member_id
  ) INTO v_revoked;
  IF v_revoked THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Barcode revoked');
  END IF;

  SELECT * INTO v_member FROM members WHERE id = v_member_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Member not found or inactive');
  END IF;

  IF p_event_id IS NOT NULL THEN
    SELECT * INTO v_rsvp FROM event_rsvps WHERE event_id = p_event_id AND member_id = v_member_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'valid', true, 'rsvp', false,
        'name', v_member.full_name, 'tier', v_member.tier::text,
        'photo', v_member.photo_url, 'display_id', v_member.display_id,
        'warning', 'No RSVP for this event'
      );
    END IF;
    IF v_rsvp.checked_in_at IS NOT NULL THEN
      RETURN jsonb_build_object(
        'valid', true, 'rsvp', true, 'already_checked_in', true,
        'checked_in_at', v_rsvp.checked_in_at,
        'name', v_member.full_name, 'tier', v_member.tier::text,
        'photo', v_member.photo_url, 'display_id', v_member.display_id
      );
    END IF;
    UPDATE event_rsvps SET checked_in_at = now() WHERE id = v_rsvp.id;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'rsvp', (p_event_id IS NOT NULL AND v_rsvp.id IS NOT NULL),
    'name', v_member.full_name, 'tier', v_member.tier::text,
    'photo', v_member.photo_url, 'display_id', v_member.display_id,
    'city', v_member.city, 'company', v_member.company, 'title', v_member.title
  );
END;
$$;

-- ============================================================
-- CORRIDOR OPPORTUNITIES
-- ============================================================
CREATE TABLE corridor_opportunities (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type            opportunity_type NOT NULL,
  title           text NOT NULL,
  description     text,
  min_tier        membership_tier NOT NULL DEFAULT 'silver',
  closing_date    date,
  posted_by       uuid REFERENCES members(id),
  partner_name    text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE corridor_interests (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id  bigint NOT NULL REFERENCES corridor_opportunities(id),
  member_id       uuid NOT NULL REFERENCES members(id),
  message         text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (opportunity_id, member_id)
);

-- ============================================================
-- ALIGNED (Matching)
-- ============================================================
CREATE TABLE aligned_matches (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_a        uuid NOT NULL REFERENCES members(id),
  member_b        uuid NOT NULL REFERENCES members(id),
  stage           aligned_stage NOT NULL DEFAULT 'new',
  a_decision      text CHECK (a_decision IN ('accept', 'pass')),
  b_decision      text CHECK (b_decision IN ('accept', 'pass')),
  match_reasons   jsonb,
  match_score     real,
  a_decided_at    timestamptz,
  b_decided_at    timestamptz,
  revealed_at     timestamptz,
  expires_at      timestamptz NOT NULL,
  week_of         date NOT NULL,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (member_a, member_b, week_of),
  CHECK (member_a < member_b)
);

CREATE TABLE aligned_history (
  member_a  uuid NOT NULL,
  member_b  uuid NOT NULL,
  matched_at timestamptz DEFAULT now(),
  PRIMARY KEY (member_a, member_b),
  CHECK (member_a < member_b)
);

CREATE TABLE aligned_reports (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter    uuid NOT NULL REFERENCES members(id),
  reported    uuid NOT NULL REFERENCES members(id),
  match_id    bigint REFERENCES aligned_matches(id),
  reason      text NOT NULL,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES members(id),
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- ALIGNED FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION aligned_decide(p_match_id bigint, p_member_id uuid, p_decision text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_match aligned_matches%ROWTYPE; v_is_a boolean;
BEGIN
  SELECT * INTO v_match FROM aligned_matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_match.stage NOT IN ('new', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match already resolved');
  END IF;

  v_is_a := (p_member_id = v_match.member_a);
  IF NOT v_is_a AND p_member_id != v_match.member_b THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your match');
  END IF;

  IF v_is_a THEN
    UPDATE aligned_matches SET a_decision = p_decision, a_decided_at = now() WHERE id = p_match_id;
  ELSE
    UPDATE aligned_matches SET b_decision = p_decision, b_decided_at = now() WHERE id = p_match_id;
  END IF;

  SELECT * INTO v_match FROM aligned_matches WHERE id = p_match_id;

  IF p_decision = 'pass' THEN
    UPDATE aligned_matches SET stage = 'declined' WHERE id = p_match_id;
    RETURN jsonb_build_object('success', true, 'stage', 'declined');
  END IF;

  IF v_match.a_decision = 'accept' AND v_match.b_decision = 'accept' THEN
    UPDATE aligned_matches SET stage = 'revealed', revealed_at = now() WHERE id = p_match_id;
    RETURN jsonb_build_object('success', true, 'stage', 'revealed');
  ELSIF v_match.a_decision IS NOT NULL OR v_match.b_decision IS NOT NULL THEN
    UPDATE aligned_matches SET stage = 'accepted' WHERE id = p_match_id;
    RETURN jsonb_build_object('success', true, 'stage', 'accepted');
  ELSE
    RETURN jsonb_build_object('success', true, 'stage', 'new');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION generate_weekly_matches()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week date;
  v_match_count int := 0;
  v_member record;
  v_candidate record;
  v_score real;
  v_matched_this_week uuid[] := '{}';
BEGIN
  v_week := date_trunc('week', now())::date;

  FOR v_member IN
    SELECT m.* FROM members m
    WHERE m.status = 'active'
      AND tier_level(m.tier) >= 2
      AND m.id NOT IN (SELECT reported FROM aligned_reports WHERE resolved_at IS NULL)
    ORDER BY random()
  LOOP
    IF v_member.id = ANY(v_matched_this_week) THEN CONTINUE; END IF;

    FOR v_candidate IN
      SELECT m.*,
        (CASE WHEN m.industry = v_member.industry THEN 0.3 ELSE 0.0 END)
        + (CASE WHEN m.city = v_member.city THEN 0.2 ELSE 0.1 END)
        + (CASE WHEN m.tier != v_member.tier THEN 0.15 ELSE 0.05 END)
        + (random() * 0.35) AS score
      FROM members m
      WHERE m.status = 'active'
        AND tier_level(m.tier) >= 2
        AND m.id != v_member.id
        AND m.id != ALL(v_matched_this_week)
        AND m.id NOT IN (SELECT reported FROM aligned_reports WHERE resolved_at IS NULL)
        AND NOT EXISTS (
          SELECT 1 FROM aligned_history
          WHERE member_a = LEAST(m.id, v_member.id) AND member_b = GREATEST(m.id, v_member.id)
        )
      ORDER BY score DESC
      LIMIT 1
    LOOP
      v_score := v_candidate.score;

      INSERT INTO aligned_matches (
        member_a, member_b, match_score, week_of, expires_at, match_reasons
      ) VALUES (
        LEAST(v_member.id, v_candidate.id),
        GREATEST(v_member.id, v_candidate.id),
        v_score, v_week, now() + INTERVAL '7 days',
        jsonb_build_array(
          CASE WHEN v_candidate.industry = v_member.industry
            THEN jsonb_build_object('type', 'industry', 'detail', 'Both in ' || v_member.industry)
            ELSE jsonb_build_object('type', 'cross_industry', 'detail', v_member.industry || ' meets ' || v_candidate.industry)
          END,
          CASE WHEN v_candidate.city = v_member.city
            THEN jsonb_build_object('type', 'city', 'detail', 'Both in ' || v_member.city)
            ELSE jsonb_build_object('type', 'cross_city', 'detail', v_member.city || ' + ' || v_candidate.city)
          END
        )
      );

      INSERT INTO aligned_history (member_a, member_b)
      VALUES (LEAST(v_member.id, v_candidate.id), GREATEST(v_member.id, v_candidate.id))
      ON CONFLICT DO NOTHING;

      v_matched_this_week := v_matched_this_week || v_member.id || v_candidate.id;
      v_match_count := v_match_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_match_count;
END;
$$;

-- ============================================================
-- CITY PRESENCE
-- ============================================================
CREATE TABLE city_presence (
  member_id     uuid PRIMARY KEY REFERENCES members(id),
  city          text NOT NULL,
  is_active     boolean DEFAULT false,
  last_active_at timestamptz DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id     uuid NOT NULL REFERENCES members(id),
  type          notification_type NOT NULL,
  title         text NOT NULL,
  body          text,
  data          jsonb,
  read_at       timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- ADMIN ROLES
-- ============================================================
CREATE TABLE admin_roles (
  member_id     uuid PRIMARY KEY REFERENCES members(id),
  role          text NOT NULL CHECK (role IN ('admin', 'editor', 'door_staff')),
  granted_by    uuid REFERENCES members(id),
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- RATE LIMITING
-- ============================================================
CREATE TABLE rate_limits (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_address    text NOT NULL,
  endpoint      text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM rate_limits WHERE created_at < now() - INTERVAL '15 minutes';
$$;

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip text, p_endpoint text,
  p_max_requests int DEFAULT 60,
  p_window_minutes int DEFAULT 15
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM rate_limits
  WHERE ip_address = p_ip AND endpoint = p_endpoint
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
  IF v_count >= p_max_requests THEN RETURN false; END IF;
  INSERT INTO rate_limits (ip_address, endpoint) VALUES (p_ip, p_endpoint);
  RETURN true;
END;
$$;

-- ============================================================
-- DEAD LETTER QUEUE
-- ============================================================
CREATE TABLE dead_letter_queue (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  function_name   text NOT NULL,
  payload         jsonb NOT NULL,
  error_message   text,
  attempts        int DEFAULT 1,
  last_attempt_at timestamptz DEFAULT now(),
  resolved_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
