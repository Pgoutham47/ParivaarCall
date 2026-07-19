-- Bolna voice agent + Vobiz telephony integration.
-- Outbound calls are placed through the Bolna API and finalized asynchronously
-- by the /api/webhooks/bolna callback, matched on provider_call_id.

alter table public.call_logs
add column if not exists call_provider text,
add column if not exists provider_call_id text,
add column if not exists transcript text;

create index if not exists call_logs_provider_call_id_idx
on public.call_logs (provider_call_id);
