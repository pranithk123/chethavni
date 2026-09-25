-- Chethavni subscriptions, usage, and server-side limits.
-- Run this in the Supabase SQL editor after reviewing the existing table policies.

create extension if not exists pgcrypto;

alter type public.subscription_tier add value if not exists 'starter';

alter table public.profiles
  add column if not exists plan_tier text not null default 'free',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists plan_updated_at timestamptz;

do $migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'tier'
  ) then
    execute $sql$
      update public.profiles
      set plan_tier = case
        when lower(nullif(tier::text, '')) in ('free', 'starter', 'pro')
          then lower(tier::text)::public.subscription_tier
        else 'free'::public.subscription_tier
      end
      where plan_tier::text = ''
    $sql$;
  end if;
end $migration$;

update public.profiles
set plan_tier = 'free'::public.subscription_tier
where plan_tier::text not in ('free', 'starter', 'pro', 'scale');

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('day', 'month')),
  period_start date not null,
  execution_count integer not null default 0 check (execution_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_type, period_start)
);

create index if not exists usage_records_user_period_idx
  on public.usage_records (user_id, period_type, period_start desc);

create table if not exists public.manual_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_tier text not null check (plan_tier in ('starter', 'pro')),
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  activated_by uuid not null references auth.users(id),
  payment_method text not null default 'whatsapp_manual',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists manual_subscriptions_user_idx
  on public.manual_subscriptions (user_id, created_at desc);

create table if not exists public.free_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  normalized_email text,
  email_domain text,
  verification_status text not null default 'unverified',
  risk_status text not null default 'normal',
  created_at timestamptz not null default now()
);

alter table public.usage_records enable row level security;
alter table public.manual_subscriptions enable row level security;
alter table public.free_entitlements enable row level security;

drop policy if exists "Users can read their usage" on public.usage_records;
create policy "Users can read their usage"
  on public.usage_records for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own subscriptions" on public.manual_subscriptions;
create policy "Users can read their own subscriptions"
  on public.manual_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own free entitlement" on public.free_entitlements;
create policy "Users can read their own free entitlement"
  on public.free_entitlements for select
  using (auth.uid() = user_id);

create or replace function public.track_free_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.free_entitlements (user_id, normalized_email, email_domain, verification_status)
  values (
    new.id,
    lower(nullif(new.email, '')),
    lower(nullif(split_part(coalesce(new.email, ''), '@', 2), '')),
    case when new.email_confirmed_at is null then 'unverified' else 'verified' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists track_free_entitlement on auth.users;
create trigger track_free_entitlement
  after insert on auth.users
  for each row execute function public.track_free_entitlement();

create or replace function public.effective_plan(p_plan_tier text, p_expires_at timestamptz)
returns text
language sql
stable
as $$
  select case
    when lower(coalesce(p_plan_tier, 'free')) in ('starter', 'pro')
      and (p_expires_at is null or p_expires_at <= now()) then 'free'
    when lower(coalesce(p_plan_tier, 'free')) = 'pro' then 'pro'
    when lower(coalesce(p_plan_tier, 'free')) = 'starter' then 'starter'
    else 'free'
  end
$$;

create or replace function public.protect_profile_plan_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
begin
  if coalesce(request_role, '') <> 'service_role'
    and (
      new.plan_tier is distinct from old.plan_tier
      or new.plan_expires_at is distinct from old.plan_expires_at
      or new.plan_updated_at is distinct from old.plan_updated_at
    ) then
    raise exception 'Plan fields can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_plan_fields on public.profiles;
create trigger protect_profile_plan_fields
  before update on public.profiles
  for each row execute function public.protect_profile_plan_fields();

create or replace function public.create_pipeline_if_allowed(
  p_name text,
  p_description text default null
)
returns table (id uuid)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_plan text;
  workflow_limit integer;
  workflow_count integer;
  new_pipeline_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select public.effective_plan(plan_tier, plan_expires_at)
    into current_plan
  from public.profiles
  where profiles.id = current_user_id;

  current_plan := coalesce(current_plan, 'free');
  workflow_limit := case current_plan when 'starter' then 10 when 'pro' then 50 else 2 end;

  select count(*) into workflow_count
  from public.pipelines
  where user_id = current_user_id;

  if workflow_count >= workflow_limit then
    raise exception 'WORKFLOW_LIMIT:%:%', current_plan, workflow_limit;
  end if;

  insert into public.pipelines (user_id, name, description)
  values (current_user_id, trim(p_name), nullif(trim(coalesce(p_description, '')), ''))
  returning pipelines.id into new_pipeline_id;

  return query select new_pipeline_id;
end;
$$;

create or replace function public.consume_execution(p_user_id uuid)
returns table (
  allowed boolean,
  current_count integer,
  monthly_limit integer,
  daily_count integer,
  daily_limit integer,
  plan_tier text,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_plan text;
  expires_at timestamptz;
  effective text;
  month_limit integer;
  safety_limit integer;
  month_count integer;
  today_count integer;
  month_start date := date_trunc('month', now() at time zone 'utc')::date;
  today date := (now() at time zone 'utc')::date;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  select plan_tier, plan_expires_at into raw_plan, expires_at
  from public.profiles where id = p_user_id;

  effective := public.effective_plan(raw_plan, expires_at);
  month_limit := case effective when 'starter' then 5000 when 'pro' then 25000 else 100 end;
  safety_limit := case effective when 'starter' then 2000 when 'pro' then 10000 else 100 end;

  if effective = 'free' then
    insert into public.usage_records (user_id, period_type, period_start, execution_count)
    values (p_user_id, 'day', today, 1)
    on conflict (user_id, period_type, period_start)
    do update set execution_count = usage_records.execution_count + 1, updated_at = now()
    where usage_records.execution_count < safety_limit
    returning execution_count into today_count;

    if today_count is null then
      select execution_count into today_count from public.usage_records
      where user_id = p_user_id and period_type = 'day' and period_start = today;
      return query select false, coalesce(today_count, safety_limit), month_limit,
        coalesce(today_count, safety_limit), safety_limit, effective, 'daily_limit';
      return;
    end if;

    return query select true, today_count, month_limit, today_count, safety_limit, effective, null::text;
    return;
  end if;

  insert into public.usage_records (user_id, period_type, period_start, execution_count)
  values (p_user_id, 'month', month_start, 1)
  on conflict (user_id, period_type, period_start)
  do update set execution_count = usage_records.execution_count + 1, updated_at = now()
  where usage_records.execution_count < month_limit
  returning execution_count into month_count;

  if month_count is null then
    select execution_count into month_count from public.usage_records
    where user_id = p_user_id and period_type = 'month' and period_start = month_start;
    return query select false, coalesce(month_count, month_limit), month_limit,
      0, safety_limit, effective, 'monthly_limit';
    return;
  end if;

  insert into public.usage_records (user_id, period_type, period_start, execution_count)
  values (p_user_id, 'day', today, 1)
  on conflict (user_id, period_type, period_start)
  do update set execution_count = usage_records.execution_count + 1, updated_at = now()
  where usage_records.execution_count < safety_limit
  returning execution_count into today_count;

  if today_count is null then
    update public.usage_records
    set execution_count = greatest(execution_count - 1, 0), updated_at = now()
    where user_id = p_user_id and period_type = 'month' and period_start = month_start;
    select execution_count into today_count from public.usage_records
    where user_id = p_user_id and period_type = 'day' and period_start = today;
    return query select false, month_count, month_limit,
      coalesce(today_count, safety_limit), safety_limit, effective, 'daily_safety_limit';
    return;
  end if;

  return query select true, month_count, month_limit, today_count, safety_limit, effective, null::text;
end;
$$;

revoke all on function public.consume_execution(uuid) from public, anon, authenticated;
grant execute on function public.consume_execution(uuid) to service_role;
grant execute on function public.create_pipeline_if_allowed(text, text) to authenticated;