begin;

-- A single owner, set exclusively through the SQL dashboard or trusted migrations.
create table public.site_owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table public.site_owner enable row level security;
revoke all on public.site_owner from anon, authenticated;
grant select on public.site_owner to authenticated;
create policy "Owner may read own authorization" on public.site_owner for select to authenticated using (user_id = (select auth.uid()));

create function public.is_site_owner() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.site_owner where user_id = (select auth.uid())); $$;
revoke all on function public.is_site_owner() from public;
grant execute on function public.is_site_owner() to anon, authenticated;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 200),
  description text check (length(description) <= 500),
  content text not null default '' check (length(content) <= 200000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cover_image text check (length(cover_image) <= 2048 and cover_image ~ '^https://'),
  seo_title text check (length(seo_title) <= 200),
  seo_description text check (length(seo_description) <= 500),
  constraint published_content check (status <> 'published' or (published_at is not null and length(trim(content)) > 0))
);
create index posts_published_chronology on public.posts (published_at desc, id desc) where status = 'published';
create index posts_updated on public.posts (updated_at desc);
create function public.touch_post() returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create trigger touch_post before update on public.posts for each row execute function public.touch_post();
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
create policy "Published writing is public" on public.posts for select to anon, authenticated
  using (status = 'published' and published_at <= now());
create policy "Owner reads all writing" on public.posts for select to authenticated using ((select public.is_site_owner()));
create policy "Owner creates writing" on public.posts for insert to authenticated with check ((select public.is_site_owner()));
create policy "Owner updates writing" on public.posts for update to authenticated using ((select public.is_site_owner())) with check ((select public.is_site_owner()));
create policy "Owner deletes writing" on public.posts for delete to authenticated using ((select public.is_site_owner()));

-- Public image URLs are intentional. Never upload confidential draft assets here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-images', 'article-images', true, 5242880, array['image/png','image/jpeg','image/webp']);
create policy "Owner uploads article images" on storage.objects for insert to authenticated
  with check (bucket_id = 'article-images' and (select public.is_site_owner()) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owner views image records" on storage.objects for select to authenticated
  using (bucket_id = 'article-images' and (select public.is_site_owner()));
create policy "Owner deletes article images" on storage.objects for delete to authenticated
  using (bucket_id = 'article-images' and (select public.is_site_owner()));
-- No update policy: uploads use immutable random filenames and cannot overwrite.
commit;
