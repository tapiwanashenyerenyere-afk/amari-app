-- Gold tier: sits between silver and platinum.
-- Enum-only migration (new enum values cannot be used in the same
-- transaction that adds them; functions follow in the next migration).

alter type membership_tier add value if not exists 'gold' before 'platinum';
