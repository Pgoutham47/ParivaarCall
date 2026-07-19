-- Scheduler: runs the call engine on a timer from inside Postgres.
--
-- Why here and not Vercel: a medicine reminder has to be checked every few
-- minutes, and Vercel's Hobby plan only allows one cron run per day. pg_cron
-- runs at true intervals and is free on Supabase.
--
-- BEFORE RUNNING: replace the two placeholder values in the insert below.
--   app_url     -> your deployed URL, no trailing slash (e.g. https://parivaarcall.vercel.app)
--   cron_secret -> the exact CRON_SECRET value from your .env.local / Vercel env

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Config lives in its own schema that is never exposed through the API, so the
-- cron secret is readable only by the database owner and the service role.
create schema if not exists private;

revoke all on schema private from anon, authenticated;

create table if not exists private.cron_config (
  id boolean primary key default true,
  app_url text not null,
  cron_secret text not null,
  -- Guarantees a single config row.
  constraint cron_config_singleton check (id)
);

alter table private.cron_config enable row level security;

revoke all on private.cron_config from anon, authenticated;

-- ---------------------------------------------------------------------------
-- REPLACE THESE TWO VALUES BEFORE RUNNING
-- ---------------------------------------------------------------------------
insert into private.cron_config (id, app_url, cron_secret)
values (true, 'https://REPLACE-ME.vercel.app', 'REPLACE-WITH-YOUR-CRON-SECRET')
on conflict (id) do update
set app_url = excluded.app_url,
    cron_secret = excluded.cron_secret;

-- Posts to a call-engine route with the cron secret in the Authorization
-- header. Header-only auth: the secret never appears in a URL or access log.
create or replace function private.call_engine_request(path text)
returns bigint
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  config private.cron_config%rowtype;
  request_id bigint;
begin
  select * into config from private.cron_config limit 1;

  if config is null then
    raise warning 'cron_config is empty; skipping %', path;
    return null;
  end if;

  select net.http_post(
    url := config.app_url || path,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || config.cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function private.call_engine_request(text) from anon, authenticated;

-- Re-running this migration should not create duplicate schedules.
select cron.unschedule(jobname)
from cron.job
where jobname in ('parivaar-generate-call-logs', 'parivaar-process-calls', 'parivaar-reconcile-calls');

-- 18:45 UTC = 00:15 IST, so the day's call logs exist before the first dose.
select cron.schedule(
  'parivaar-generate-call-logs',
  '45 18 * * *',
  $$select private.call_engine_request('/api/calls/generate')$$
);

-- The main loop: place any call that is now due.
select cron.schedule(
  'parivaar-process-calls',
  '*/5 * * * *',
  $$select private.call_engine_request('/api/calls/process')$$
);

-- Safety net for calls whose Bolna webhook never arrived.
select cron.schedule(
  'parivaar-reconcile-calls',
  '*/15 * * * *',
  $$select private.call_engine_request('/api/calls/reconcile')$$
);

-- Useful checks after running:
--   select jobname, schedule, active from cron.job;
--   select jobname, status, start_time, return_message
--     from cron.job_run_details order by start_time desc limit 20;
--   select id, status_code, error_msg, created
--     from net._http_response order by created desc limit 20;
