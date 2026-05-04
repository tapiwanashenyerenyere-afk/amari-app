# Supabase Migration History Guardrail

This repo must preserve every migration version recorded in the linked
production Supabase project. Do not delete old migration files from release
branches, even when the current schema has moved past them.

## What Happened

The remote database had historical migration versions that were missing from
the local release branch. Supabase correctly refused to push new migrations
until the local history matched production.

Most missing files were restored from Git history. The remote-only version
`20260406000001` could not be found in the available Git object graph, so it is
represented by `20260406000001_remote_history_marker.sql`, an intentional
no-op marker. This keeps history aligned without rewriting the remote migration
table or risking data loss.

## Release Rule

Before any store-bound build:

1. Run `npx supabase migration list`.
2. Confirm there are no remote-only migration versions.
3. Run `npx supabase db push --dry-run`.
4. Confirm only the intended new migration appears.
5. Apply with `npx supabase db push`.
6. Run `npm run verify:release`.

## Data Integrity Rule

Never use `supabase migration repair` to mark remote migrations reverted unless
the production database has been inspected and the team has explicitly decided
the remote version is wrong. Prefer restoring the missing local file. If the
original file is unrecoverable, add a clearly named no-op history marker and
document why.
