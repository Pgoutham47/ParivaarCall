begin;
-- Browser clients may read their own outcomes, but only the server may queue,
-- claim or finalize calls and create alerts. This prevents forged call jobs.
drop policy if exists "Users can insert own call logs" on public.call_logs;
drop policy if exists "Users can update own call logs" on public.call_logs;
drop policy if exists "Users can insert own alerts" on public.alerts;
revoke insert, update, delete on public.call_logs from authenticated, anon;
revoke insert, delete on public.alerts from authenticated, anon;

-- A schedule may only refer to a parent in the same account.
drop policy if exists "Users can CRUD own medicine schedules" on public.medicine_schedules;
create policy "Users can CRUD own medicine schedules" on public.medicine_schedules for all to authenticated
using (caregiver_id = auth.uid())
with check (caregiver_id = auth.uid() and exists (select 1 from public.parents p where p.id = parent_id and p.caregiver_id = auth.uid()));

-- Enforce validation even when the UI is bypassed. NOT VALID preserves any
-- older data while enforcing the constraints for every new/changed row.
alter table public.parents add constraint parent_valid_fields check (
  char_length(trim(name)) between 1 and 100 and phone ~ '^\+[1-9][0-9]{7,14}$'
  and (age is null or age between 1 and 120)
) not valid;
alter table public.medicine_schedules add constraint medicine_valid_fields check (
  char_length(trim(medicine_name)) between 1 and 150
  and (dosage_instruction is null or char_length(dosage_instruction) <= 500)
  and frequency in ('daily','weekly') and start_date is not null
  and (end_date is null or end_date >= start_date)
) not valid;
alter table public.voice_settings add constraint valid_retry_limits check (
  max_retries between 0 and 5 and retry_delay_minutes between 5 and 120
) not valid;

-- Cancelling pending work and changing the record happen in the same database
-- transaction. Calls already in progress must finish before a record changes.
create or replace function public.guard_family_call_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'parents' then
    if exists (select 1 from public.call_logs where parent_id = old.id and call_status = 'calling') then
      raise exception 'A call is in progress. Wait for it to finish before changing this parent.';
    end if;
    delete from public.call_logs where parent_id = old.id and call_status = 'pending';
  else
    if exists (select 1 from public.call_logs where medicine_schedule_id = old.id and call_status = 'calling') then
      raise exception 'A call is in progress. Wait for it to finish before changing this medicine.';
    end if;
    delete from public.call_logs where medicine_schedule_id = old.id and call_status = 'pending';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function public.guard_family_call_changes() from public;
create trigger guard_parent_calls before update or delete on public.parents for each row execute function public.guard_family_call_changes();
create trigger guard_medicine_calls before update or delete on public.medicine_schedules for each row execute function public.guard_family_call_changes();

create index if not exists parents_caregiver_created_idx on public.parents(caregiver_id, created_at desc);
create index if not exists medicines_caregiver_time_idx on public.medicine_schedules(caregiver_id, scheduled_time);
create index if not exists call_logs_caregiver_created_idx on public.call_logs(caregiver_id, created_at desc);
create index if not exists call_logs_caregiver_started_idx on public.call_logs(caregiver_id, call_started_at desc);
-- Serialize a call claim with changes to its parent and medicine. Only the
-- service role can invoke this function; browser clients cannot dial directly.
create or replace function public.claim_pending_call(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare job public.call_logs; affected integer;
begin
  select * into job from public.call_logs where id = p_id;
  if not found then return false; end if;
  perform id from public.parents where id = job.parent_id for update;
  if job.medicine_schedule_id is not null then
    perform id from public.medicine_schedules where id = job.medicine_schedule_id for update;
  end if;
  update public.call_logs set call_status = 'calling', call_started_at = now()
  where id = p_id and call_status = 'pending';
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
revoke all on function public.claim_pending_call(uuid) from public, anon, authenticated;
grant execute on function public.claim_pending_call(uuid) to service_role;
commit;
