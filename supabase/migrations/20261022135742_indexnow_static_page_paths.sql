begin;
alter table public.indexnow_jobs drop constraint indexnow_jobs_path_check;
alter table public.indexnow_jobs add constraint indexnow_jobs_path_check
  check (length(path) <= 129 and (path in ('/', '/writing', '/about') or path ~ '^/writing/[a-z0-9]+(-[a-z0-9]+)*$'));
commit;
