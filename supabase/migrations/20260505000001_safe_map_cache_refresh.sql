-- Supabase safe-update protection rejects DELETE statements without a WHERE
-- clause. Project approval calls this cache refresh from the mobile admin
-- panel, so every cache-clearing delete must be explicit.

begin;

create or replace function public.refresh_map_cache()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  min_per_region integer := 3;
begin
  delete from public.map_cache_countries where true;
  delete from public.map_cache_states where true;
  delete from public.map_cache_projects where true;

  insert into public.map_cache_countries (country_code, country_name, project_count, categories, centroid, refreshed_at)
  select
    rc.country_code,
    max(rc.country_name),
    count(p.id)::integer,
    (
      select jsonb_object_agg(cat, cnt)
      from (
        select p2.category::text as cat, count(*)::integer as cnt
        from public.projects p2
        join public.region_centroids rc2 on p2.region_id = rc2.id
        where p2.status = 'approved'
          and rc2.country_code = rc.country_code
        group by p2.category
      ) sub
    ),
    (
      select centroid
      from public.region_centroids
      where country_code = rc.country_code
        and geo_level = 'country'
      limit 1
    ),
    now()
  from public.projects p
  join public.region_centroids rc on p.region_id = rc.id
  where p.status = 'approved'
  group by rc.country_code;

  insert into public.map_cache_states (country_code, state_province, display_label, project_count, categories, centroid, refreshed_at)
  select
    rc.country_code,
    coalesce(rc.state_province, rc.country_name),
    coalesce(
      (
        select display_label
        from public.region_centroids
        where country_code = rc.country_code
          and state_province = rc.state_province
          and geo_level = 'state'
        limit 1
      ),
      rc.country_name
    ),
    count(p.id)::integer,
    (
      select jsonb_object_agg(cat, cnt)
      from (
        select p2.category::text as cat, count(*)::integer as cnt
        from public.projects p2
        join public.region_centroids rc2 on p2.region_id = rc2.id
        where p2.status = 'approved'
          and rc2.country_code = rc.country_code
          and (
            rc2.state_province = rc.state_province
            or (rc2.state_province is null and rc.state_province is null)
          )
        group by p2.category
      ) sub
    ),
    coalesce(
      (
        select centroid
        from public.region_centroids
        where country_code = rc.country_code
          and state_province = rc.state_province
          and geo_level = 'state'
        limit 1
      ),
      (
        select centroid
        from public.region_centroids
        where country_code = rc.country_code
          and geo_level = 'country'
        limit 1
      )
    ),
    now()
  from public.projects p
  join public.region_centroids rc on p.region_id = rc.id
  where p.status = 'approved'
    and rc.state_province is not null
  group by rc.country_code, rc.state_province, rc.country_name;

  insert into public.map_cache_projects (
    project_id, name, description, category, creator_first_name,
    display_label, image_url, external_link, display_point, refreshed_at
  )
  select
    p.id,
    p.name,
    p.description,
    p.category,
    coalesce(nullif(split_part(m.full_name, ' ', 1), ''), 'Member'),
    case
      when rc.country_code = 'AU' then
        coalesce(
          (
            select display_label
            from public.region_centroids
            where country_code = rc.country_code
              and state_province = rc.state_province
              and geo_level = 'state'
            limit 1
          ),
          rc.country_name
        )
      when region_count >= min_per_region then rc.display_label
      when rc.geo_level = 'city' and region_count < min_per_region then
        coalesce(
          (
            select display_label
            from public.region_centroids
            where country_code = rc.country_code
              and state_province = rc.state_province
              and geo_level = 'state'
            limit 1
          ),
          rc.display_label
        )
      when rc.geo_level = 'state' and region_count < min_per_region then
        rc.country_name
      else rc.display_label
    end,
    p.image_url,
    p.external_link,
    case
      when rc.country_code = 'AU' then
        coalesce(
          (
            select centroid
            from public.region_centroids
            where country_code = rc.country_code
              and state_province = rc.state_province
              and geo_level = 'state'
            limit 1
          ),
          (
            select centroid
            from public.region_centroids
            where country_code = rc.country_code
              and geo_level = 'country'
            limit 1
          ),
          rc.centroid
        )
      when region_count >= min_per_region then rc.centroid
      when rc.geo_level = 'city' and region_count < min_per_region then
        coalesce(
          (
            select centroid
            from public.region_centroids
            where country_code = rc.country_code
              and state_province = rc.state_province
              and geo_level = 'state'
            limit 1
          ),
          rc.centroid
        )
      when rc.geo_level = 'state' and region_count < min_per_region then
        coalesce(
          (
            select centroid
            from public.region_centroids
            where country_code = rc.country_code
              and geo_level = 'country'
            limit 1
          ),
          rc.centroid
        )
      else rc.centroid
    end,
    now()
  from public.projects p
  join public.members m on p.creator_id = m.id
  join public.region_centroids rc on p.region_id = rc.id
  cross join lateral (
    select count(*)::integer as region_count
    from public.projects p2
    where p2.region_id = p.region_id
      and p2.status = 'approved'
  ) counts
  where p.status = 'approved';
end;
$fn$;

revoke all on function public.refresh_map_cache() from public;
revoke all on function public.refresh_map_cache() from anon;
revoke all on function public.refresh_map_cache() from authenticated;
grant execute on function public.refresh_map_cache() to service_role;

notify pgrst, 'reload schema';

commit;
