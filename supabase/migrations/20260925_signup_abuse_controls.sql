-- Signup abuse controls. Run this in the Supabase SQL editor.

create table if not exists public.signup_rate_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0)
);

alter table public.signup_rate_limits enable row level security;

create or replace function public.check_signup_rate_limit(
  p_ip_hash text,
  p_limit integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  request_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
  current_window signup_rate_limits%rowtype;
begin
  if coalesce(request_role, '') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_ip_hash));

  select * into current_window
  from public.signup_rate_limits
  where ip_hash = p_ip_hash
  for update;

  if not found or current_window.window_started_at <= now() - interval '1 hour' then
    insert into public.signup_rate_limits (ip_hash, window_started_at, attempt_count)
    values (p_ip_hash, now(), 1)
    on conflict (ip_hash) do update
      set window_started_at = excluded.window_started_at,
          attempt_count = excluded.attempt_count;
    return true;
  end if;

  if current_window.attempt_count >= greatest(p_limit, 1) then
    return false;
  end if;

  update public.signup_rate_limits
  set attempt_count = attempt_count + 1
  where ip_hash = p_ip_hash;
  return true;
end;
$$;

revoke all on function public.check_signup_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.check_signup_rate_limit(text, integer) to service_role;
