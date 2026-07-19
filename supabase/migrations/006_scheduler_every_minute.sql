-- Tightens reminder timing.
--
-- The process job previously ran every 5 minutes, so a dose set for 9:00 could
-- be called as late as 9:05. Running every minute keeps a reminder within about
-- a minute of its scheduled time. The job is a single HTTP POST, and it exits
-- immediately when nothing is due, so the extra runs are cheap.
--
-- Safe to run more than once. Requires 005_scheduler_cron.sql to have been run.

select cron.unschedule('parivaar-process-calls')
where exists (select 1 from cron.job where jobname = 'parivaar-process-calls');

select cron.schedule(
  'parivaar-process-calls',
  '* * * * *',
  $$select private.call_engine_request('/api/calls/process')$$
);

-- Verify:
--   select jobname, schedule, active from cron.job order by jobname;
