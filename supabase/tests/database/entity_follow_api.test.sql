begin;

select plan(28);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000e001', 'authenticated', 'authenticated', 'pr-e-active@example.invalid', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000e002', 'authenticated', 'authenticated', 'pr-e-suspended@example.invalid', '', now(), '{}', '{}', now(), now());

insert into public.members (id, display_id, full_name, email, status)
values
  ('00000000-0000-0000-0000-00000000e001', 'AMARI-TEST-E001', 'PR E Active', 'pr-e-active@example.invalid', 'active'),
  ('00000000-0000-0000-0000-00000000e002', 'AMARI-TEST-E002', 'PR E Suspended', 'pr-e-suspended@example.invalid', 'suspended');

insert into public.tracked_entities (kind, name, industry, region, active, status)
values
  ('company', 'PR E Approved Entity', 'technology', 'africa', true, 'approved'),
  ('company', 'PR E Candidate Entity', 'technology', 'africa', true, 'candidate'),
  ('company', 'PR E Disabled Entity', 'technology', 'africa', false, 'approved');

select set_config('test.pr_e_approved_id', (select id::text from public.tracked_entities where name = 'PR E Approved Entity'), true);
select set_config('test.pr_e_candidate_id', (select id::text from public.tracked_entities where name = 'PR E Candidate Entity'), true);
select set_config('test.pr_e_disabled_id', (select id::text from public.tracked_entities where name = 'PR E Disabled Entity'), true);

insert into public.news_sources (name, feed_url, region, default_weight)
values ('PR E Source', 'https://example.invalid/pr-e-feed', 'global', 1.0);

insert into public.news_articles (
  source_id, url, url_hash, title, published_at, topics, regions, relevance, summary, status, entities
)
select id, 'https://example.invalid/pr-e-entity', 'pr-e-entity', 'PR E Entity Article', now(),
  array['technology'], array['africa'], 50, 'Entity article.', 'published', array['PR E Approved Entity']
from public.news_sources where feed_url = 'https://example.invalid/pr-e-feed';

insert into public.news_articles (
  source_id, url, url_hash, title, published_at, topics, regions, relevance, summary, status, entities
)
select id, 'https://example.invalid/pr-e-plain', 'pr-e-plain', 'PR E Plain Article', now(),
  array['technology'], array['africa'], 50, 'Plain article.', 'published', '{}'::text[]
from public.news_sources where feed_url = 'https://example.invalid/pr-e-feed';

select ok(has_function_privilege('authenticated', 'public.set_entity_follow(bigint,boolean)', 'EXECUTE'), 'authenticated can execute follow RPC');
select ok(not has_function_privilege('anon', 'public.set_entity_follow(bigint,boolean)', 'EXECUTE'), 'anonymous cannot execute follow RPC');
select is((select prosecdef from pg_proc where oid = 'public.set_entity_follow(bigint,boolean)'::regprocedure), true, 'follow RPC is security definer');
select ok((select proconfig @> array['search_path=public'] from pg_proc where oid = 'public.set_entity_follow(bigint,boolean)'::regprocedure), 'follow RPC fixes search path');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'member_entity_follows' and cmd = 'SELECT'), 1::bigint, 'follows have one select-only policy');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'member_entity_follows' and cmd <> 'SELECT'), 0::bigint, 'follows have no direct-write policy');
select ok(has_table_privilege('authenticated', 'public.member_entity_follows', 'SELECT'), 'authenticated has follows select privilege');
select ok(not has_table_privilege('authenticated', 'public.member_entity_follows', 'INSERT'), 'authenticated cannot insert follows directly');
select ok(not has_table_privilege('authenticated', 'public.member_entity_follows', 'UPDATE'), 'authenticated cannot update follows directly');
select ok(not has_table_privilege('authenticated', 'public.member_entity_follows', 'DELETE'), 'authenticated cannot delete follows directly');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e001', true);

select lives_ok(
  $$select public.set_entity_follow(current_setting('test.pr_e_approved_id')::bigint, true)$$,
  'active member can follow an approved active entity'
);
select is(
  public.set_entity_follow(current_setting('test.pr_e_approved_id')::bigint, true),
  true,
  'following an already-followed entity is idempotently true'
);
select is((select count(*) from public.member_entity_follows), 1::bigint, 'idempotent follow creates one row');
select is((select count(*) from public.member_entity_follows where member_id = auth.uid()), 1::bigint, 'active member can select own follows');
select is(
  (select matched_entity from public.get_news_feed(20, 0) where title = 'PR E Entity Article'),
  'PR E Approved Entity',
  'feed returns a matched entity from an eligible follow'
);
select ok(
  (select score from public.get_news_feed(20, 0) where title = 'PR E Entity Article')
    > (select score from public.get_news_feed(20, 0) where title = 'PR E Plain Article'),
  'eligible followed entity boosts ranking'
);

reset role;
update public.tracked_entities set status = 'retired' where name = 'PR E Approved Entity';
select is((select count(*) from public.member_entity_follows), 1::bigint, 'retirement retains the follow row');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e001', true);
select is(
  (select matched_entity from public.get_news_feed(20, 0) where title = 'PR E Entity Article'),
  null,
  'retired entity stops matching and boosting'
);
select throws_ok(
  $$select public.set_entity_follow(current_setting('test.pr_e_approved_id')::bigint, true)$$,
  'P0001',
  'Entity is not available to follow',
  'retired entity cannot be re-followed even while its retained row exists'
);

reset role;
update public.tracked_entities set status = 'approved' where name = 'PR E Approved Entity';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e001', true);
select is(
  (select matched_entity from public.get_news_feed(20, 0) where title = 'PR E Entity Article'),
  'PR E Approved Entity',
  're-approved entity resumes matching without a new follow'
);
select throws_ok(
  $$select public.set_entity_follow(current_setting('test.pr_e_candidate_id')::bigint, true)$$,
  'P0001',
  'Entity is not available to follow',
  'candidate entity cannot be followed'
);
select throws_ok(
  $$select public.set_entity_follow(current_setting('test.pr_e_disabled_id')::bigint, true)$$,
  'P0001',
  'Entity is not available to follow',
  'disabled entity cannot be followed'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e002', true);
select throws_ok(
  $$select public.set_entity_follow(current_setting('test.pr_e_approved_id')::bigint, true)$$,
  'P0001',
  'Active membership required',
  'suspended member cannot change follows'
);
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$select public.set_entity_follow(1, true)$$,
  'P0001',
  'Active membership required',
  'caller without an authenticated user cannot change follows'
);

reset role;
update public.tracked_entities set status = 'retired' where name = 'PR E Approved Entity';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e001', true);
select is(
  public.set_entity_follow(current_setting('test.pr_e_approved_id')::bigint, false),
  false,
  'active member can unfollow a retired entity'
);

reset role;
select is((select count(*) from public.member_entity_follows), 0::bigint, 'unfollow removes the retained row');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e001', true);
select is(
  public.set_entity_follow(current_setting('test.pr_e_approved_id')::bigint, false),
  false,
  'unfollowing an absent follow is idempotently false'
);
select throws_ok(
  $$select public.set_entity_follow(current_setting('test.pr_e_approved_id')::bigint, true)$$,
  'P0001',
  'Entity is not available to follow',
  'retired entity cannot be newly followed'
);

select * from finish();
rollback;
