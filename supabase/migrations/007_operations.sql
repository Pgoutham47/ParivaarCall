begin;
create table if not exists private.engine_requests (
  request_id bigint primary key,
  path text not null,
  requested_at timestamptz not null default now()
);
alter table private.engine_requests enable row level security;
revoke all on private.engine_requests from public, anon, authenticated;

create or replace function private.call_engine_request(path text)
returns bigint language plpgsql security definer set search_path = private, public, extensions as $$
declare config private.cron_config%rowtype; request_id bigint;
begin
  select * into config from private.cron_config limit 1;
  if config is null then raise exception 'Scheduler configuration is missing'; end if;
  select net.http_post(url := config.app_url || path,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || config.cron_secret),
    body := '{}'::jsonb, timeout_milliseconds := 30000) into request_id;
  insert into private.engine_requests(request_id, path) values(request_id, path);
  delete from private.engine_requests where requested_at < now() - interval '7 days';
  return request_id;
end;
$$;
revoke all on function private.call_engine_request(text) from public, anon, authenticated;

create or replace function public.operations_health()
returns jsonb language sql security definer set search_path = public, private, extensions as $$
select jsonb_build_object(
  'checkedAt',now(),
  'overdueCalls',(select count(*) from public.call_logs where call_status='pending' and scheduled_for < now()-interval '5 minutes'),
  'stuckCalls',(select count(*) from public.call_logs where call_status='calling' and call_started_at < now()-interval '20 minutes'),
  'schedulerEnabled',(select count(*)=3 from cron.job where active and jobname in ('parivaar-generate-call-logs','parivaar-process-calls','parivaar-reconcile-calls')),
  'lastWorkerSuccess',(select max(r.requested_at) from private.engine_requests r join net._http_response h on h.id=r.request_id where r.path='/api/calls/process' and h.status_code=200 and not h.timed_out and coalesce(h.content::jsonb->'errors','[]'::jsonb)='[]'::jsonb),
  'recentWorkerFailures',(select count(*) from private.engine_requests r join net._http_response h on h.id=r.request_id where r.requested_at>now()-interval '10 minutes' and (coalesce(h.status_code,0)>=400 or h.timed_out))
);
$$;
revoke all on function public.operations_health() from public, anon, authenticated;
grant execute on function public.operations_health() to service_role;

-- One statement gives a transactionally consistent application/auth snapshot.
-- Auth sessions are intentionally omitted: recovery requires fresh sign-in.
create or replace function public.export_recovery_snapshot()
returns jsonb language sql security definer set search_path = public, auth, private as $$
select jsonb_build_object(
  'version',1,'createdAt',now(),
  'tables',jsonb_build_object(
    'auth.users',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from auth.users t),
    'auth.identities',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from auth.identities t),
    'public.profiles',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.profiles t),
    'public.parents',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.parents t),
    'public.medicine_schedules',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.medicine_schedules t),
    'public.voice_settings',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.voice_settings t),
    'public.call_logs',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.call_logs t),
    'public.alerts',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.alerts t),
    'private.cron_config',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from private.cron_config t)
  ),
  'columns',(select jsonb_object_agg(table_name,columns) from (
    select n.nspname||'.'||c.relname as table_name,
      jsonb_agg(jsonb_build_object('name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod)) order by a.attnum) as columns
    from pg_class c join pg_namespace n on c.relnamespace=n.oid join pg_attribute a on a.attrelid=c.oid
    where n.nspname||'.'||c.relname in ('auth.users','auth.identities','public.profiles','public.parents','public.medicine_schedules','public.voice_settings','public.call_logs','public.alerts','private.cron_config')
      and a.attnum>0 and not a.attisdropped group by n.nspname,c.relname
  ) cols)
);
$$;
revoke all on function public.export_recovery_snapshot() from public, anon, authenticated;
grant execute on function public.export_recovery_snapshot() to service_role;
commit;
