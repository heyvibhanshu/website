begin;
-- The caller already has SELECT on its own authorization row through RLS.
-- Elevated privileges and anonymous RPC access are unnecessary.
alter function public.is_site_owner() security invoker;
revoke execute on function public.is_site_owner() from anon, public;
grant execute on function public.is_site_owner() to authenticated;
commit;
