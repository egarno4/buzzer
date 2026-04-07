-- Buzzer MVP: run in Supabase SQL Editor (or migrate via CLI)
--
-- Also configure:
-- 1) Authentication → URL configuration → Redirect URLs: include
--    http://localhost:5173/onboarding/proof
--    https://<your-vercel-domain>/onboarding/proof
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
  status text not null default 'pending'
);

alter table public.profiles enable row level security;

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
