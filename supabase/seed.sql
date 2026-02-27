-- ============================================================
-- TEST DATA FOR DEVELOPMENT
-- ============================================================

-- Test invitation codes (matching production format)
INSERT INTO invitation_codes (code, tier_grant, grants_admin, expires_at) VALUES
  ('AMARI-ADM-999', 'laureate', true, now() + interval '1 year'),
  ('AMARI-BRD-999', 'platinum', false, now() + interval '1 year'),
  ('AMARI-ELT-999', 'silver', false, now() + interval '1 year'),
  ('AMARI-MBR-999', 'member', false, now() + interval '1 year');

-- Test pulse edition
INSERT INTO pulse_editions (publish_date, status, headline, summary_content, full_content, stats) VALUES
  (CURRENT_DATE, 'published', 'The 2026 Laureate Class Revealed',
   '{"blocks": [{"type": "text", "content": "Seven alchemists. Seven paradigm shifts. This week we reveal the 2026 Laureate Class."}]}'::jsonb,
   '{"blocks": [{"type": "text", "content": "Full editorial content here..."}, {"type": "quote", "content": "We build what we wish existed.", "author": "AMARI Member"}]}'::jsonb,
   '{"alchemists": 527, "cities": 12, "connections": 2340, "opportunities": 45}'::jsonb
  );

-- Test events
INSERT INTO events (type, title, description, min_tier, capacity, starts_at, ends_at, venue_name, venue_address) VALUES
  ('vibes', 'AfroBeats x Jazz Night', 'An evening of connection and conversation', 'member', 100, now() + interval '14 days', now() + interval '14 days' + interval '4 hours', 'Rooftop Bar Melbourne', '123 Collins St, Melbourne VIC 3000'),
  ('dinner', 'Platinum Table', 'An intimate dinner for our Platinum and Laureate members', 'platinum', 20, now() + interval '21 days', now() + interval '21 days' + interval '3 hours', 'Flower Drum', '17 Market Ln, Melbourne VIC 3000'),
  ('talk', 'Alchemist Talks: Future of AI', 'A deep dive into AI with industry leaders', 'silver', 50, now() + interval '7 days', now() + interval '7 days' + interval '2 hours', 'State Library Victoria', '328 Swanston St, Melbourne VIC 3000'),
  ('gala', 'AMARI Gala 2026', 'The annual celebration of our community', 'member', 300, '2026-11-15 18:00:00+11', '2026-11-16 01:00:00+11', 'Melbourne Convention Centre', '1 Convention Centre Pl, South Wharf VIC 3006');

-- Test corridor opportunities
INSERT INTO corridor_opportunities (type, title, description, min_tier, closing_date, partner_name) VALUES
  ('co_invest', 'Series A — Pan-African Logistics', '$2.5M round, 3 spots remaining', 'laureate', CURRENT_DATE + 30, 'Pan-African Logistics Co'),
  ('board', 'Advisory Board — Digital Health', 'Equity + retainer, quarterly commitment', 'platinum', CURRENT_DATE + 45, 'Digital Health AU'),
  ('speaking', '2027 Global Business Summit', 'International delegates, March 2027', 'member', CURRENT_DATE + 60, 'Global Business Summit'),
  ('procurement', 'KPMG Diversity Supplier Programme', 'Enterprise contracts, immediate', 'member', CURRENT_DATE + 90, 'KPMG');
