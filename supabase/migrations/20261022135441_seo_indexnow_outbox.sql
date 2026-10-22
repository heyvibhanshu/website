begin;
-- A transactional outbox: a failed notification cannot lose a published change.
create table public.indexnow_jobs (
  path text primary key check (path in ('/', '/writing') or path ~ '^/writing/[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null check (kind in ('public', 'removed', 'collection')),
  version bigint not null default 1,
  available_at timestamptz not null default now(),
  attempts integer not null default 0,
  lease_token uuid,
  lease_until timestamptz,
  failed boolean not null default false,
  last_status integer
);
create index indexnow_jobs_ready on public.indexnow_jobs (available_at) where not failed;
alter table public.indexnow_jobs enable row level security;
revoke all on public.indexnow_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.indexnow_jobs to authenticated, service_role;
grant select on public.posts to service_role;
create policy "Only site owner manages indexing outbox" on public.indexnow_jobs for all to authenticated
  using ((select public.is_site_owner())) with check ((select public.is_site_owner()));

create table public.indexnow_control (singleton boolean primary key default true check (singleton), next_allowed_at timestamptz not null default '-infinity');
insert into public.indexnow_control values (true, '-infinity');
alter table public.indexnow_control enable row level security;
revoke all on public.indexnow_control from public, anon, authenticated;
grant select, update on public.indexnow_control to service_role;

-- A no-op save is not a new modification date.
create or replace function public.touch_post() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.created_at := old.created_at;
  new.updated_at := case when (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then now() else old.updated_at end;
  return new;
end;
$$;

create function public.queue_post_indexnow() returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  old_public boolean := false;
  new_published boolean := false;
  paths text[] := '{}';
  kinds text[] := '{}';
  i integer;
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'updated_at') = (to_jsonb(old) - 'updated_at') then return new; end if;
  if tg_op <> 'INSERT' then
    old_public := old.status = 'published' and old.published_at <= now();
    if tg_op = 'DELETE' or new.slug <> old.slug or new.status <> 'published' then
      delete from public.indexnow_jobs where path = '/writing/' || old.slug and kind = 'public';
      if old_public then
        paths := array_append(paths, '/writing/' || old.slug); kinds := array_append(kinds, 'removed');
      end if;
    end if;
  end if;
  if tg_op <> 'DELETE' then
    new_published := new.status = 'published';
    if new_published then
      paths := array_append(paths, '/writing/' || new.slug);
      kinds := array_append(kinds, case when old_public and tg_op = 'UPDATE' and new.slug = old.slug and new.published_at > now() then 'removed' else 'public' end);
    end if;
  end if;
  if old_public or (new_published and new.published_at <= now()) then
    paths := paths || array['/', '/writing']; kinds := kinds || array['collection', 'collection'];
  end if;
  for i in 1..coalesce(array_length(paths, 1), 0) loop
    insert into public.indexnow_jobs as jobs (path, kind, available_at) values (paths[i], kinds[i], case when kinds[i] = 'public' then greatest(now(), new.published_at) else now() end)
    on conflict (path) do update set kind = case when jobs.kind = 'removed' and excluded.kind = 'public' and excluded.available_at > now() then jobs.kind else excluded.kind end, version = jobs.version + 1,
      available_at = case when jobs.kind = 'removed' and excluded.kind = 'public' and excluded.available_at > now() then jobs.available_at when excluded.kind = 'collection' then least(jobs.available_at, excluded.available_at) else excluded.available_at end,
      attempts = 0, failed = false, lease_token = null, lease_until = null, last_status = null;
  end loop;
  return coalesce(new, old);
end;
$$;
revoke all on function public.queue_post_indexnow() from public, anon, authenticated;
create trigger posts_indexnow after insert or update or delete on public.posts for each row execute function public.queue_post_indexnow();

-- Only the server worker can lease jobs. No elevated function privileges.
create function public.claim_indexnow_jobs() returns setof public.indexnow_jobs
language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.indexnow_control where singleton and next_allowed_at <= now() for update skip locked;
  if not found then return; end if;
  update public.indexnow_control set next_allowed_at = now() + interval '1 minute' where singleton;
  -- Discard stale pending publishes (e.g. a scheduled article was withdrawn).
  delete from public.indexnow_jobs j where j.kind = 'public' and j.available_at <= now()
    and not exists (select 1 from public.posts p where '/writing/' || p.slug = j.path and p.status = 'published' and p.published_at <= now());
  return query
    with ready as (select j.path from public.indexnow_jobs j where not j.failed and j.available_at <= now()
      and (j.lease_until is null or j.lease_until < now()) order by j.available_at limit 100 for update skip locked)
    update public.indexnow_jobs j set lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes', attempts = j.attempts + 1
    from ready where j.path = ready.path returning j.*;
end;
$$;
create function public.finish_indexnow_jobs(p_jobs jsonb, p_outcome text, p_retry_at timestamptz, p_status integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_outcome not in ('success', 'retry', 'failed') then raise exception 'Invalid outcome'; end if;
  if p_outcome = 'success' then
    -- A formerly public article can be rescheduled. Notify removal now and
    -- retain its future publication in the same deduplicated outbox row.
    update public.indexnow_jobs j set kind = 'public', available_at = p.published_at,
      version = j.version + 1, attempts = 0, lease_token = null, lease_until = null
      from public.posts p, jsonb_to_recordset(p_jobs) as done(path text, version bigint, lease_token uuid)
      where j.path = done.path and j.version = done.version and j.lease_token = done.lease_token
        and j.kind = 'removed' and '/writing/' || p.slug = j.path and p.status = 'published';
    delete from public.indexnow_jobs j using jsonb_to_recordset(p_jobs) as done(path text, version bigint, lease_token uuid)
      where j.path = done.path and j.version = done.version and j.lease_token = done.lease_token;
  else
    update public.indexnow_jobs j set available_at = greatest(coalesce(p_retry_at, now() + interval '1 hour'), now() + interval '1 minute'),
      failed = p_outcome = 'failed' or j.attempts >= 8, lease_token = null, lease_until = null, last_status = p_status
      from jsonb_to_recordset(p_jobs) as done(path text, version bigint, lease_token uuid)
      where j.path = done.path and j.version = done.version and j.lease_token = done.lease_token;
    if p_outcome = 'retry' then
      update public.indexnow_control set next_allowed_at = greatest(next_allowed_at, coalesce(p_retry_at, now() + interval '1 hour')) where singleton;
    end if;
  end if;
end;
$$;
revoke all on function public.claim_indexnow_jobs() from public, anon, authenticated;
revoke all on function public.finish_indexnow_jobs(jsonb, text, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.claim_indexnow_jobs(), public.finish_indexnow_jobs(jsonb, text, timestamptz, integer) to service_role;
commit;
