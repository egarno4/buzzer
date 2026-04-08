-- Run in Supabase SQL Editor (or via migration) to add notification preference.
-- Safe to run multiple times.

alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

-- Refresh RPC so neighbor lookups include preference (for skipping emails when off).
create or replace function public.neighbor_contact_for_unit(p_building text, p_unit text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from public.profiles me
    where me.id = auth.uid()
      and me.status = 'approved'
      and me.address = p_building
  ) then
    return null;
  end if;

  select jsonb_build_object(
    'email', p.email,
    'first_name', p.first_name,
    'email_notifications', coalesce(p.email_notifications, true)
  )
  into result
  from public.profiles p
  where p.address = p_building
    and p.unit = p_unit
    and p.status = 'approved'
  limit 1;

  return result;
end;
$$;

revoke all on function public.neighbor_contact_for_unit(text, text) from public;
grant execute on function public.neighbor_contact_for_unit(text, text) to authenticated;
