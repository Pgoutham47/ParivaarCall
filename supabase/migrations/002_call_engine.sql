alter table public.call_logs
add column if not exists retry_parent_call_log_id uuid references public.call_logs(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from public.call_logs
    where medicine_schedule_id is not null
      and scheduled_for is not null
    group by caregiver_id, parent_id, medicine_schedule_id, scheduled_for
    having count(*) > 1
  ) then
    create unique index if not exists call_logs_unique_schedule_slot
    on public.call_logs (caregiver_id, parent_id, medicine_schedule_id, scheduled_for)
    where medicine_schedule_id is not null and scheduled_for is not null;
  else
    raise notice 'Skipped call_logs_unique_schedule_slot because duplicate historical call logs exist.';
  end if;
end $$;

create index if not exists call_logs_scheduled_for_idx
on public.call_logs (scheduled_for);

create index if not exists call_logs_caregiver_status_idx
on public.call_logs (caregiver_id, call_status);

create index if not exists call_logs_pending_due_idx
on public.call_logs (scheduled_for)
where call_status = 'pending';

create index if not exists alerts_caregiver_read_idx
on public.alerts (caregiver_id, is_read, created_at desc);

drop policy if exists "Users can update own call logs" on public.call_logs;
create policy "Users can update own call logs"
on public.call_logs for update
to authenticated
using (caregiver_id = auth.uid())
with check (caregiver_id = auth.uid());
