-- Optional: constrain public.requests.status to known workflow values.
-- Run only if all existing rows use one of these statuses (or fix data first).
-- Skip this file if you prefer unconstrained text.

alter table public.requests
  drop constraint if exists requests_status_check;

alter table public.requests
  add constraint requests_status_check
  check (status in ('open', 'claimed', 'collected'));
