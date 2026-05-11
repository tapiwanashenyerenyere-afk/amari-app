-- Remote history marker.
--
-- The linked production database has migration version 20260406000001 recorded
-- in supabase_migrations.schema_migrations, but the original SQL file is not
-- present in the available Git history for this repository.
--
-- This intentional no-op keeps local migration history aligned with production
-- without rewriting or repairing remote history. Do not add schema changes here.
-- Future schema changes must be added in a new timestamped migration.

do $$
begin
  raise notice '20260406000001 remote history marker: no-op';
end $$;
