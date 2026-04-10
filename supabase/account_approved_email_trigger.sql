-- Account approved → send-email Edge Function (type: account_approved)
--
-- Prerequisites:
-- 1) Dashboard → Database → Extensions: enable "pg_net" (this file runs create extension if not exists).
-- 2) Deploy send-email with INVITE_SECRET (same value you put in invite_secret below).
-- 3) Edit the constants in notify_send_account_approved_email() OR load them from Vault
--    (recommended for production — do not commit real keys).
--
-- Edge Function auth: account_approved uses x-invite-secret + INVITE_SECRET (same as building_invite).
-- Gateway: pass apikey + Authorization Bearer with your project anon key.

create extension if not exists pg_net;

create or replace function public.notify_send_account_approved_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  -- TODO: replace with your values (or read from vault.decrypted_secrets).
  edge_url constant text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email';
  anon_key constant text := 'YOUR_SUPABASE_ANON_KEY';
  invite_secret constant text := 'YOUR_INVITE_SECRET';
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if old.status = 'pending' and new.status = 'approved' then
    payload := jsonb_build_object(
      'type', 'account_approved',
      'to', new.email,
      'data', jsonb_build_object(
        'first_name', new.first_name,
        'building_address', new.address
      )
    );

    -- pg_net: net.http_post(url text, body jsonb, headers jsonb)
    perform net.http_post(
      url := edge_url,
      body := payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key,
        'apikey', anon_key,
        'x-invite-secret', invite_secret
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_account_approved_email on public.profiles;
create trigger trg_profiles_account_approved_email
  after update of status on public.profiles
  for each row
  execute function public.notify_send_account_approved_email();

comment on function public.notify_send_account_approved_email() is
  'Queues account_approved email via pg_net when profiles.status goes pending → approved.';
