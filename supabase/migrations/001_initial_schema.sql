create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  relationship text not null,
  phone text not null,
  age int,
  language text not null,
  city text,
  emergency_contact_name text,
  emergency_contact_phone text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.medicine_schedules (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.parents(id) on delete cascade,
  medicine_name text not null,
  dosage_instruction text,
  scheduled_time time not null,
  food_timing text,
  frequency text default 'daily',
  is_important boolean default false,
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.voice_settings (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid references public.profiles(id) on delete cascade unique,
  preferred_language text default 'Telugu',
  voice_gender text default 'female',
  voice_tone text default 'warm',
  retry_delay_minutes int default 10,
  max_retries int default 2,
  whatsapp_enabled boolean default true,
  sms_enabled boolean default false,
  email_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.parents(id) on delete cascade,
  medicine_schedule_id uuid references public.medicine_schedules(id) on delete set null,
  scheduled_for timestamptz,
  call_started_at timestamptz,
  call_ended_at timestamptz,
  call_status text,
  response_type text,
  retry_count int default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid references public.profiles(id) on delete cascade,
  parent_id uuid references public.parents(id) on delete cascade,
  medicine_schedule_id uuid references public.medicine_schedules(id) on delete set null,
  alert_type text not null,
  severity text default 'medium',
  title text not null,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_parents_updated_at on public.parents;
create trigger set_parents_updated_at
before update on public.parents
for each row execute function public.set_updated_at();

drop trigger if exists set_medicine_schedules_updated_at on public.medicine_schedules;
create trigger set_medicine_schedules_updated_at
before update on public.medicine_schedules
for each row execute function public.set_updated_at();

drop trigger if exists set_voice_settings_updated_at on public.voice_settings;
create trigger set_voice_settings_updated_at
before update on public.voice_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        phone = coalesce(excluded.phone, public.profiles.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.parents enable row level security;
alter table public.medicine_schedules enable row level security;
alter table public.voice_settings enable row level security;
alter table public.call_logs enable row level security;
alter table public.alerts enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
on public.profiles for delete
to authenticated
using (id = auth.uid());

drop policy if exists "Users can CRUD own parents" on public.parents;
create policy "Users can CRUD own parents"
on public.parents for all
to authenticated
using (caregiver_id = auth.uid())
with check (caregiver_id = auth.uid());

drop policy if exists "Users can CRUD own medicine schedules" on public.medicine_schedules;
create policy "Users can CRUD own medicine schedules"
on public.medicine_schedules for all
to authenticated
using (caregiver_id = auth.uid())
with check (caregiver_id = auth.uid());

drop policy if exists "Users can CRUD own voice settings" on public.voice_settings;
create policy "Users can CRUD own voice settings"
on public.voice_settings for all
to authenticated
using (caregiver_id = auth.uid())
with check (caregiver_id = auth.uid());

drop policy if exists "Users can read own call logs" on public.call_logs;
create policy "Users can read own call logs"
on public.call_logs for select
to authenticated
using (caregiver_id = auth.uid());

drop policy if exists "Users can insert own call logs" on public.call_logs;
create policy "Users can insert own call logs"
on public.call_logs for insert
to authenticated
with check (caregiver_id = auth.uid());

drop policy if exists "Users can read own alerts" on public.alerts;
create policy "Users can read own alerts"
on public.alerts for select
to authenticated
using (caregiver_id = auth.uid());

drop policy if exists "Users can insert own alerts" on public.alerts;
create policy "Users can insert own alerts"
on public.alerts for insert
to authenticated
with check (caregiver_id = auth.uid());

drop policy if exists "Users can update own alerts" on public.alerts;
create policy "Users can update own alerts"
on public.alerts for update
to authenticated
using (caregiver_id = auth.uid())
with check (caregiver_id = auth.uid());
