# Parivaar Call

Parivaar Call is an MVP caregiver web app where children can manage medicine reminder schedules for elderly parents. Parents do not use an app. The app uses Supabase for authentication, caregiver profiles, parents, medicines, call logs, alerts, and voice settings. Reminder calls are made by a Bolna voice agent over Vobiz telephony.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres with Row Level Security
- [Bolna](https://bolna.ai) voice AI agent (ASR + LLM + TTS, Indian languages) for the reminder conversations
- [Vobiz](https://vobiz.ai) programmable telephony (India-focused, TRAI-compliant) as the calling line connected through Bolna

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=long-random-secret
APP_TIMEZONE=Asia/Kolkata
CALL_PROVIDER=simulated
ALLOW_RANDOM_SIMULATED_CALLS=false
BOLNA_API_KEY=
BOLNA_AGENT_ID=
BOLNA_FROM_PHONE_NUMBER=
BOLNA_WEBHOOK_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` is required for cron-style API routes that run without a logged-in browser session. Do not expose it to the browser. `CALL_PROVIDER=simulated` stays the safe default: no real calls are placed. Set `CALL_PROVIDER=bolna` to place real calls once Bolna and Vobiz are configured.

`APP_TIMEZONE` (default `Asia/Kolkata`) is the IANA timezone all call scheduling uses. Medicine times entered by caregivers are interpreted in this zone regardless of the server's clock, so deployments on UTC hosts such as Vercel still call at the parent's local time.

## Bolna + Vobiz Setup

1. Create a [Vobiz](https://vobiz.ai) account and copy the Auth Token and Auth Secret from Vobiz Console → Settings → API Keys.
2. Create a [Bolna](https://bolna.ai) account and connect Vobiz in Bolna → Providers using those credentials (status should show Connected).
3. Buy or provision a Vobiz phone number inside the Bolna platform and set it as `BOLNA_FROM_PHONE_NUMBER`.
4. Create a Bolna voice agent for medicine reminders:
   - Prompt it to read the reminder using the `reminder_script` context variable and speak in `script_language`.
   - Configure post-call data extraction with a field named `reminder_outcome` whose value is one of `taken`, `later`, `help`, or `no_response`.
   - Set the agent's webhook URL to `https://your-domain/api/webhooks/bolna?secret=<BOLNA_WEBHOOK_SECRET>`.
5. Copy the Bolna API key and agent id into `BOLNA_API_KEY` and `BOLNA_AGENT_ID`.
6. Set `CALL_PROVIDER=bolna`.

The app passes these context variables with every call: `call_log_id`, `parent_name`, `medicine_name`, `dosage_instruction`, `scheduled_time`, `script_language`, `reminder_script`, and `retry_count`.

## Deployment

Hosting is Vercel; there is no separate backend service. The Next.js API routes under `app/api/` are the backend and run as serverless functions alongside the pages.

1. Push the repository to GitHub and import it in Vercel (framework preset: Next.js, no build overrides needed).
2. Set these environment variables in the Vercel project:

   | Variable | Notes |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | From the Supabase project |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From the Supabase project |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never expose to the browser |
   | `CRON_SECRET` | Long random string; must match `private.cron_config` |
   | `APP_TIMEZONE` | `Asia/Kolkata` |
   | `APP_URL` | The deployed URL, used for links in alert emails |
   | `CALL_PROVIDER` | `simulated` until the Bolna agent is verified, then `bolna` |
   | `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `BOLNA_FROM_PHONE_NUMBER` | Bolna + Vobiz |
   | `BOLNA_WEBHOOK_SECRET` | Also used in the Bolna agent's webhook URL |
   | `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` | Optional; alert emails are skipped when unset |

3. Deploy, then point the Bolna agent's webhook at `https://your-domain/api/webhooks/bolna?secret=<BOLNA_WEBHOOK_SECRET>`.
4. Run the scheduler migration — see [Scheduler Setup](#scheduler-setup).

Deploying with `CALL_PROVIDER=simulated` first is recommended: the whole pipeline runs end to end without placing real phone calls.

## Supabase Setup

1. Create a Supabase project.
2. Copy the project URL and anon key into `.env.local`.
3. Open the Supabase SQL editor.
4. Run [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql).
5. Run [supabase/migrations/002_call_engine.sql](./supabase/migrations/002_call_engine.sql).
6. Run [supabase/migrations/003_call_scripts_tts.sql](./supabase/migrations/003_call_scripts_tts.sql).
7. Run [supabase/migrations/004_bolna_vobiz.sql](./supabase/migrations/004_bolna_vobiz.sql).
8. In Supabase Auth, enable email/password authentication.
9. Configure email confirmation based on your local testing preference. If confirmation is enabled, signup will create the account and ask the user to confirm email before login.
10. After deploying, run [supabase/migrations/005_scheduler_cron.sql](./supabase/migrations/005_scheduler_cron.sql) to start the scheduler — see [Scheduler Setup](#scheduler-setup) for the values it needs.

## Database Tables

The migration creates:

- `profiles`
- `parents`
- `medicine_schedules`
- `voice_settings`
- `call_logs`
- `alerts`

All tables have Row Level Security enabled. Caregivers can only read/write rows where their user id owns the row. Call logs and alerts are readable by the owner, and authenticated owner inserts are allowed so future app/dev actions can create records before telephony webhooks are added.

## Available Screens

- `/` landing page
- `/login` Supabase email/password login
- `/signup` Supabase signup with profile creation
- `/dashboard` real parent and medicine summary
- `/dashboard/parents` Supabase-backed parent CRUD
- `/dashboard/medicines` Supabase-backed medicine schedule CRUD
- `/dashboard/calls` Supabase call logs with empty state
- `/dashboard/alerts` Supabase alerts with empty state
- `/dashboard/analytics` adherence analytics: 7/30-day adherence, streak, daily confirmations, per-medicine and per-parent breakdowns
- `/dashboard/settings` Supabase-backed voice and notification settings

## Call Scheduling Engine v2

The call engine supports two providers:

- `CALL_PROVIDER=simulated` (default): no real phone calls, SMS, or WhatsApp messages. Results are returned synchronously.
- `CALL_PROVIDER=bolna`: real outbound calls. The engine POSTs to the Bolna API; Bolna's voice agent dials the parent through the connected Vobiz line, has the reminder conversation, and reports the outcome back to `/api/webhooks/bolna`.

Flow:

1. Active medicine schedules are read for the current day.
2. Pending `call_logs` are created for each schedule time.
3. Due pending calls are processed through the selected provider.
4. Simulated calls finalize immediately; Bolna calls stay in `calling` with a stored `provider_call_id` until the webhook arrives.
5. `call_logs` are updated with status, response type, transcript, and recording URL (Bolna).
6. Alerts are created for missed medicine, help requests, and no-answer calls after retries are exhausted.
7. Snoozed and retryable no-answer calls create retry `call_logs` using `voice_settings.retry_delay_minutes` and `voice_settings.max_retries`.

Statuses:

- `pending`
- `calling`
- `confirmed`
- `snoozed`
- `no_answer`
- `missed`
- `failed`
- `need_help`

Response types:

- `dtmf_1_taken`
- `dtmf_2_later`
- `dtmf_3_help`
- `speech_taken`
- `speech_later`
- `speech_help`
- `no_response`

## Call Engine API Routes

All cron routes accept either header (query-string secrets are not accepted, so they never end up in access logs):

```bash
Authorization: Bearer $CRON_SECRET
```

or:

```bash
x-cron-secret: $CRON_SECRET
```

In production the schedule runs from Supabase `pg_cron`, not Vercel. Vercel's Hobby plan allows only one cron run per day, and a medicine reminder has to be checked every few minutes; `pg_cron` runs at true intervals and is included free with Supabase. See [Scheduler Setup](#scheduler-setup).

In development only, a logged-in dashboard user can trigger these routes from the dev controls without exposing `CRON_SECRET` to the browser.

- `POST /api/calls/generate` creates today's pending call logs and returns created/skipped counts.
- `POST /api/calls/process` processes due pending call logs and returns outcome counts (Bolna calls count as `calling` until the webhook lands).
- `POST /api/calls/process-one` processes one call log for development testing; returns 409 if the log is no longer pending.
- `POST /api/calls/reconcile` (also GET) finds calls stuck in `calling` for 10+ minutes, polls the Bolna execution API for their result, finalizes completed ones, and marks anything unresolved after 60 minutes as `failed` so alerts still fire when a webhook is lost.
- `POST /api/webhooks/bolna` receives Bolna call results (status, extracted `reminder_outcome`, transcript, recording) and finalizes the matching call log; protected by `BOLNA_WEBHOOK_SECRET` via `x-webhook-secret` header or `?secret=` query param.
- `POST /api/alerts/[alertId]/read` marks one alert as read for the logged-in caregiver.

Example local testing:

```bash
curl -X POST http://localhost:3000/api/calls/generate \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST http://localhost:3000/api/calls/process \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST http://localhost:3000/api/calls/process-one \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"callLogId":"CALL_LOG_ID","simulatedResponse":"confirmed"}'
```

Allowed `simulatedResponse` values:

- `confirmed`
- `snoozed`
- `no_answer`
- `missed`
- `need_help`

## Scheduler Setup

The call engine is driven by three scheduled jobs defined in [supabase/migrations/005_scheduler_cron.sql](./supabase/migrations/005_scheduler_cron.sql):

| Job | Schedule (UTC) | Purpose |
| --- | --- | --- |
| `parivaar-generate-call-logs` | `45 18 * * *` (00:15 IST) | Create today's pending call logs |
| `parivaar-process-calls` | `*/5 * * * *` | Place calls that are now due |
| `parivaar-reconcile-calls` | `*/15 * * * *` | Recover calls whose webhook never arrived |

To enable them:

1. Deploy the app first, so you have a public URL.
2. In the Supabase dashboard, open Database → Extensions and enable `pg_cron` and `pg_net`.
3. Open the SQL editor and paste `005_scheduler_cron.sql`, replacing the two placeholder values in the `insert` statement with your deployed URL (no trailing slash) and the exact `CRON_SECRET` from your Vercel environment.
4. Run it, then verify with `select jobname, schedule, active from cron.job;`.

The secret lives in `private.cron_config`, a schema that is never exposed through the Supabase API, and is sent as an `Authorization: Bearer` header. To rotate it, update that row and the Vercel environment variable together.

Check job history with:

```sql
select jobname, status, start_time, return_message
from cron.job_run_details order by start_time desc limit 20;

select id, status_code, error_msg, created
from net._http_response order by created desc limit 20;
```

## Caregiver Email Notifications

When an alert is created, the caregiver is emailed immediately via [Resend](https://resend.com) — a critical "parent needs help" alert should never wait for someone to open the dashboard. Set `RESEND_API_KEY` (and optionally `NOTIFY_FROM_EMAIL` and `APP_URL` for the email's dashboard link) to enable it; with no key configured, emails are skipped silently and nothing else changes. Email failures are logged and never break call processing.

## Retry and Alert Rules

- `snoozed`: creates a retry call after `voice_settings.retry_delay_minutes` while `retry_count < voice_settings.max_retries`; after retries are exhausted, creates a high `missed_medicine` alert so an unconfirmed dose is never silently dropped.
- `no_answer`: creates a retry while `retry_count < voice_settings.max_retries`; after retries are exhausted, creates a medium `no_answer` alert.
- `missed`: creates a high `missed_medicine` alert.
- `need_help`: creates a critical `need_help` alert with the parent phone number in the message.
- `failed` (provider error, low balance, or the call could not be placed): creates a high `call_failed` alert.

Call processing claims each pending log with a conditional `pending -> calling` update, so overlapping cron runs or repeated `process-one` requests cannot dial the same parent twice; already-claimed logs are reported as `skipped`. If the provider request itself throws, the log is finalized as `failed` instead of being stuck in `calling`.

Generated call logs are idempotent. The database migration adds a unique index for the same `caregiver_id`, `parent_id`, `medicine_schedule_id`, and `scheduled_for` when historical data is already clean; the service also checks for an existing log before insert.

## Native-Language Scripts

Call logs store a deterministic medicine reminder script when they are generated. Scripts are rule-based templates, so reminders stay predictable and avoid hallucinated medical advice. The script is passed to the Bolna agent as the `reminder_script` context variable, and the agent is instructed to stick to it.

Supported script languages:

- Telugu
- Hindi
- English
- Tamil
- Kannada

If a parent or setting has an unsupported language, the script generator falls back to English and logs a warning. If voice settings use `Parent preferred language`, the parent language is used when supported.

Each generated script:

- Mentions the medicine name.
- Includes dosage instruction and food timing when available.
- Uses a respectful relationship address such as Amma, Appa, or Papa ji.
- Explains keypad options for taken, remind later, and need help.
- Avoids diagnosis, dosage changes, emotional pressure, and pretending to be the real child.

## Voice and Audio

Speech is handled entirely by the Bolna voice agent: Bolna does ASR, the LLM conversation, and TTS on the live call. There is no separate TTS pipeline in this app anymore.

- Bolna call recordings (when returned by the webhook) are stored in `call_logs.audio_url` and shown as a "Call recording" player on `/dashboard/calls`. Audio is never autoplayed.
- Call transcripts from Bolna are stored in `call_logs.transcript` and shown on `/dashboard/calls`.
- No voice cloning is implemented.

## Project Structure

```text
app/                    App Router pages and layouts
components/auth/        Auth-related controls
components/dashboard/   Dashboard UI and page managers
components/forms/       Auth, parent, and medicine forms
components/layout/      Sidebar and mobile navigation
components/ui/          Reusable UI primitives
lib/call-scripts/       Rule-based native-language call templates
lib/call-providers/     Simulated and Bolna (Vobiz telephony) call providers
lib/services/           Supabase query and mutation services
lib/supabase/           Supabase client, server, and middleware helpers
lib/database.types.ts   Supabase database types
lib/types.ts            App-facing TypeScript models
supabase/migrations/    SQL schema and RLS migrations
```

## Completed

- Supabase App Router client/server helpers
- Route protection for `/dashboard/*`
- Auth redirect handling for logged-in users on `/login` and `/signup`
- Signup profile creation via database trigger, plus app-side upsert when a session exists
- Parent CRUD persistence
- Medicine schedule CRUD persistence with parent display joins
- Voice settings creation and updates
- Dashboard cards from real Supabase data
- Calls and alerts read from Supabase with clean empty states
- Call Scheduling Engine with safe simulation mode
- Bolna voice agent outbound calls over Vobiz telephony
- Bolna webhook for call results, transcripts, and recordings
- Native-language rule-based call scripts
- Development controls for generating and processing call logs
- Alert read/unread handling

## Still Future Work

- Bolna webhook signature verification (currently shared-secret based; the Bolna dashboard only accepts a plain webhook URL)
- WhatsApp/SMS notification channels alongside email
- Call recording retention policy
- Payments
- Production validation and automated tests
