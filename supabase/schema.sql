-- Buzzer MVP: run in Supabase SQL Editor (or migrate via CLI)
--
-- Also configure:
-- 1) Authentication → URL configuration → Redirect URLs: include
--    http://localhost:5173/onboarding/proof
--    http://localhost:5173/app
--    https://<your-vercel-domain>/onboarding/proof
--    https://buzzer.nyc/app   (post-approval magic link → MainApp; REQUIRED in Redirect URLs)
--       Same URL must be allowed so PKCE (?code=) / implicit (#access_token) returns land on MainApp.
--    (and Site URL / additional redirect origins as needed)
-- 2) Authentication → Providers → Email: enable; use magic link (or link + OTP off) for sign-in
-- 3) Storage: if the bucket insert below fails, create bucket "proofs" (private) in the Dashboard, then re-run policies only

-- Profiles (created after magic-link verification)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  address text not null,
  unit text not null,
  borough text not null,
  email text not null,
  proof_type text,
  proof_file_url text,
  status text not null default 'pending',
  email_notifications boolean not null default true,
  invite_sent boolean not null default false
);

alter table public.profiles enable row level security;

-- Existing databases: add column if the table was created before this field existed.
alter table public.profiles
  add column if not exists email_notifications boolean not null default true;
alter table public.profiles
  add column if not exists invite_sent boolean not null default false;
alter table public.profiles
  add column if not exists application_received_email_sent_at timestamptz;
alter table public.profiles
  add column if not exists approval_email_sent_at timestamptz;

-- Approval emails are sent from admin-portal → send-email (magic link). Drop legacy trigger if present.
drop trigger if exists trg_profiles_account_approved_email on public.profiles;
drop function if exists public.notify_send_account_approved_email();

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Storage: create bucket "proofs" in Dashboard → Storage → New bucket
-- Set to private (recommended). Policies below assume bucket id = proofs

insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload proof to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own proof files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own proof files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own proof files" on storage.objects;
create policy "Users can delete own proof files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Session 2: main app tables
-- Users are scoped by their verified profile address (building-level isolation).

create extension if not exists pgcrypto;

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  building_address text not null,
  from_unit text not null,
  held_by_unit text not null,
  held_by_name text not null,
  note text,
  status text not null default 'waiting',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  building_address text not null,
  requester_unit text not null,
  requester_name text not null,
  note text not null,
  status text not null default 'open',
  chosen_volunteer_unit text,
  chosen_volunteer_name text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  unit text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (request_id, unit)
);

create index if not exists packages_building_created_idx
  on public.packages (building_address, created_at desc);
create index if not exists packages_from_unit_idx
  on public.packages (building_address, from_unit);

create index if not exists requests_building_created_idx
  on public.requests (building_address, created_at desc);

alter table public.requests
  drop constraint if exists requests_status_check;
alter table public.requests
  add constraint requests_status_check
  check (status in ('open', 'claimed', 'collected'));

create index if not exists volunteers_request_idx
  on public.volunteers (request_id, created_at desc);

alter table public.packages
  add column if not exists created_by uuid references auth.users (id);
alter table public.requests
  add column if not exists created_by uuid references auth.users (id);

alter table public.packages enable row level security;
alter table public.requests enable row level security;
alter table public.volunteers enable row level security;

create policy "Packages visible to same building"
  on public.packages for select
  using (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "Packages inserted in own building" on public.packages;
create policy "Packages inserted in own building"
  on public.packages for insert
  with check (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
    and created_by = auth.uid()
  );

drop policy if exists "Packages updated in own building" on public.packages;
create policy "Packages updated by logger or recipient"
  on public.packages for update
  using (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
    and (
      created_by = auth.uid()
      or from_unit = (
        select p.unit from public.profiles p where p.id = auth.uid()
      )
    )
  )
  with check (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
    and (
      created_by = auth.uid()
      or from_unit = (
        select p.unit from public.profiles p where p.id = auth.uid()
      )
    )
  );

drop policy if exists "Users can delete own packages" on public.packages;
create policy "Users can delete own packages"
  on public.packages for delete
  using (created_by = auth.uid());

create policy "Requests visible to same building"
  on public.requests for select
  using (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "Requests inserted in own building" on public.requests;
create policy "Requests inserted in own building"
  on public.requests for insert
  with check (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
    and created_by = auth.uid()
  );

drop policy if exists "Requests updated in own building" on public.requests;
create policy "Requests updated by requester only"
  on public.requests for update
  using (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
    and created_by = auth.uid()
  )
  with check (
    building_address = (
      select p.address from public.profiles p where p.id = auth.uid()
    )
    and created_by = auth.uid()
  );

drop policy if exists "Users can delete own requests" on public.requests;
create policy "Users can delete own requests"
  on public.requests for delete
  using (created_by = auth.uid());

create policy "Volunteers visible in own building requests"
  on public.volunteers for select
  using (
    exists (
      select 1
      from public.requests r
      join public.profiles p on p.id = auth.uid()
      where r.id = volunteers.request_id
        and r.building_address = p.address
    )
  );

drop policy if exists "Volunteers inserted in own building requests" on public.volunteers;
create policy "Volunteers inserted as self in own building requests"
  on public.volunteers for insert
  with check (
    exists (
      select 1
      from public.requests r
      join public.profiles p on p.id = auth.uid()
      where r.id = volunteers.request_id
        and r.building_address = p.address
    )
    and (trim(both from unit), trim(both from name)) = (
      select
        trim(both from pu.unit),
        trim(both from concat(pu.first_name, ' ', pu.last_name))
      from public.profiles pu
      where pu.id = auth.uid()
    )
  );

-- Email + first name for a unit in your building (for Resend notifications). Caller must be approved on p_building.
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

-- Approved neighbors in the same building (unit + first name only; no emails). Caller must be approved on p_building.
create or replace function public.get_building_neighbors(p_building text)
returns table (unit text, first_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles me
    where me.id = auth.uid()
      and me.status = 'approved'
      and me.address = p_building
  ) then
    return;
  end if;

  return query
  select p.unit, p.first_name
  from public.profiles p
  where p.address = p_building
    and p.status = 'approved'
    and p.id <> auth.uid()
  order by p.unit;
end;
$$;

revoke all on function public.get_building_neighbors(text) from public;
grant execute on function public.get_building_neighbors(text) to authenticated;

-- Approved neighbors in the same building with email (for help-request notifications). Excludes caller. Caller must be approved on p_building.
create or replace function public.get_building_neighbor_emails_for_notifications(p_building text)
returns table (email text, first_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles me
    where me.id = auth.uid()
      and me.status = 'approved'
      and me.address = p_building
  ) then
    return;
  end if;

  return query
  select p.email, p.first_name
  from public.profiles p
  where p.address = p_building
    and p.status = 'approved'
    and p.id <> auth.uid()
    and coalesce(p.email_notifications, true) = true;
end;
$$;

revoke all on function public.get_building_neighbor_emails_for_notifications(text) from public;
grant execute on function public.get_building_neighbor_emails_for_notifications(text) to authenticated;

-- Helpful Neighbor leaderboard: actions in the building (package spotted / package held as volunteer).
create table if not exists public.neighbor_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete cascade,
  action_type text not null,
  building_address text not null,
  created_at timestamptz default now(),
  constraint neighbor_actions_action_type_check
    check (action_type in ('package_spotted', 'package_held'))
);

create index if not exists neighbor_actions_building_created_idx
  on public.neighbor_actions (building_address, created_at desc);

alter table public.neighbor_actions enable row level security;

drop policy if exists "Users can insert own actions" on public.neighbor_actions;
create policy "Users can insert own actions"
  on public.neighbor_actions for insert
  with check (auth.uid() = actor_id);

drop policy if exists "Users can read actions in their building" on public.neighbor_actions;
create policy "Users can read actions in their building"
  on public.neighbor_actions for select
  using (
    building_address = (
      select address from public.profiles where id = auth.uid()
    )
  );

-- When a request moves to claimed, credit the chosen volunteer (once per request).
create or replace function public.tg_requests_neighbor_action_package_held()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  vid uuid;
begin
  select p.id into vid
  from public.profiles p
  where p.address = new.building_address
    and trim(both from p.unit) = trim(both from new.chosen_volunteer_unit)
  limit 1;

  if vid is not null then
    insert into public.neighbor_actions (actor_id, action_type, building_address)
    values (vid, 'package_held', new.building_address);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_requests_neighbor_action_package_held on public.requests;
create trigger trg_requests_neighbor_action_package_held
  after update on public.requests
  for each row
  when (
    new.status = 'claimed'
    and old.status is distinct from 'claimed'
    and new.chosen_volunteer_unit is not null
  )
  execute function public.tg_requests_neighbor_action_package_held();

-- Leaderboard for a calendar month in America/New_York (joins profiles; bypasses profile RLS).
create or replace function public.get_building_leaderboard(p_address text, p_month int, p_year int)
returns table (actor_id uuid, first_name text, unit text, action_count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles me
    where me.id = auth.uid()
      and me.status = 'approved'
      and me.address = p_address
  ) then
    return;
  end if;

  return query
  select
    p.id as actor_id,
    p.first_name,
    p.unit,
    count(n.id)::bigint as action_count
  from public.neighbor_actions n
  join public.profiles p on p.id = n.actor_id
  where n.building_address = p_address
    and extract(year from (n.created_at at time zone 'America/New_York'))::int = p_year
    and extract(month from (n.created_at at time zone 'America/New_York'))::int = p_month
  group by p.id, p.first_name, p.unit
  order by action_count desc, p.first_name asc, p.unit asc;
end;
$$;

revoke all on function public.get_building_leaderboard(text, int, int) from public;
grant execute on function public.get_building_leaderboard(text, int, int) to authenticated;
