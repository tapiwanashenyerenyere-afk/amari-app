begin;

select plan(20);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000d001', 'authenticated', 'authenticated', 'pr-d-active@example.invalid', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000d002', 'authenticated', 'authenticated', 'pr-d-pending@example.invalid', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000d003', 'authenticated', 'authenticated', 'pr-d-suspended@example.invalid', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000d004', 'authenticated', 'authenticated', 'pr-d-inactive@example.invalid', '', now(), '{}', '{}', now(), now());

insert into public.members (id, display_id, full_name, email, status)
values
  ('00000000-0000-0000-0000-00000000d001', 'AMARI-TEST-D001', 'PR D Active', 'pr-d-active@example.invalid', 'active'),
  ('00000000-0000-0000-0000-00000000d002', 'AMARI-TEST-D002', 'PR D Pending', 'pr-d-pending@example.invalid', 'pending'),
  ('00000000-0000-0000-0000-00000000d003', 'AMARI-TEST-D003', 'PR D Suspended', 'pr-d-suspended@example.invalid', 'suspended'),
  ('00000000-0000-0000-0000-00000000d004', 'AMARI-TEST-D004', 'PR D Inactive', 'pr-d-inactive@example.invalid', 'inactive');

insert into public.member_feed_interests (member_id, tag, weight, declared)
values ('00000000-0000-0000-0000-00000000d001', 'culture', 2.5, false);

select ok(has_function_privilege('authenticated', 'public.set_feed_interests(text[])', 'EXECUTE'), 'authenticated can execute interests RPC');
select ok(not has_function_privilege('anon', 'public.set_feed_interests(text[])', 'EXECUTE'), 'anonymous cannot execute interests RPC');
select is((select prosecdef from pg_proc where oid = 'public.set_feed_interests(text[])'::regprocedure), true, 'interests RPC is security definer');
select ok((select proconfig @> array['search_path=public'] from pg_proc where oid = 'public.set_feed_interests(text[])'::regprocedure), 'interests RPC fixes search path');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'member_feed_interests' and cmd <> 'SELECT'), 0::bigint, 'member interest table has no direct-write policy');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'member_feed_interests' and cmd = 'SELECT'), 1::bigint, 'member interest table has one select-only policy');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000d001', true);

select lives_ok($$select public.set_feed_interests(array['Technology', 'Africa'])$$, 'active member can set interests');
select is((select count(*) from public.member_feed_interests where declared), 2::bigint, 'active member gets declared interests');
select is((select count(*) from public.member_feed_interests where tag = 'culture' and declared = false and weight = 2.5), 1::bigint, 'learned affinity is preserved');
select is((select count(*) from public.member_feed_interests), 3::bigint, 'active member can directly select own rows');
select ok(not has_table_privilege('authenticated', 'public.member_feed_interests', 'INSERT'), 'authenticated cannot insert directly');
select ok(not has_table_privilege('authenticated', 'public.member_feed_interests', 'UPDATE'), 'authenticated cannot update directly');
select ok(not has_table_privilege('authenticated', 'public.member_feed_interests', 'DELETE'), 'authenticated cannot delete directly');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000d002', true);
select lives_ok($$select public.set_feed_interests(array['Leadership'])$$, 'pending onboarding member can set interests');
select is((select count(*) from public.member_feed_interests), 0::bigint, 'pending member cannot directly select rows');

reset role;
select is((select count(*) from public.member_feed_interests where member_id = '00000000-0000-0000-0000-00000000d002' and tag = 'leadership' and declared), 1::bigint, 'pending RPC write is committed');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000d003', true);
select throws_ok($$select public.set_feed_interests(array['Technology'])$$, 'P0001', 'Member is not eligible to set feed interests', 'suspended member is rejected');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000d004', true);
select throws_ok($$select public.set_feed_interests(array['Technology'])$$, 'P0001', 'Member is not eligible to set feed interests', 'inactive member is rejected');
select set_config('request.jwt.claim.sub', '', true);
select throws_ok($$select public.set_feed_interests(array['Technology'])$$, 'P0001', 'Authentication required', 'anonymous caller is rejected');

reset role;
select is((select count(*) from public.member_feed_interests where member_id in ('00000000-0000-0000-0000-00000000d003', '00000000-0000-0000-0000-00000000d004')), 0::bigint, 'rejected callers write no rows');

select * from finish();
rollback;
