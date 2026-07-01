# Parivaar Call

Parivaar Call is an MVP caregiver web app where children can manage medicine reminder schedules for elderly parents. Parents do not use an app. The app now uses Supabase for authentication, caregiver profiles, parents, medicines, call logs, alerts, and voice settings.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres with Row Level Security

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
CALL_PROVIDER=simulated
ALLOW_RANDOM_SIMULATED_CALLS=false
TTS_PROVIDER=mock
GOOGLE_TTS_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
OPENAI_API_KEY=
TTS_STORAGE_BUCKET=
```

`SUPABASE_SERVICE_ROLE_KEY` is required for cron-style API routes that run without a logged-in browser session. Do not expose it to the browser. `CALL_PROVIDER=simulated` and `TTS_PROVIDER=mock` are the only safe default working providers in this version.

## Supabase Setup

1. Create a Supabase project.
2. Copy the project URL and anon key into `.env.local`.
3. Open the Supabase SQL editor.
4. Run [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql).
5. Run [supabase/migrations/002_call_engine.sql](./supabase/migrations/002_call_engine.sql).
6. Run [supabase/migrations/003_call_scripts_tts.sql](./supabase/migrations/003_call_scripts_tts.sql).
7. In Supabase Auth, enable email/password authentication.
8. Configure email confirmation based on your local testing preference. If confirmation is enabled, signup will create the account and ask the user to confirm email before login.

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
- `/dashboard/settings` Supabase-backed voice and notification settings

## Call Scheduling Engine v1

The call engine is simulation-only. It never sends real phone calls, SMS, or WhatsApp messages.

Flow:

1. Active medicine schedules are read for the current day.
2. Pending `call_logs` are created for each schedule time.
3. Due pending calls are processed through the selected provider.
4. `CALL_PROVIDER=simulated` returns a safe simulated result.
5. `call_logs` are updated with status and response type.
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

All cron routes accept either:

```bash
Authorization: Bearer $CRON_SECRET
```

or:

```bash
x-cron-secret: $CRON_SECRET
```

In development only, a logged-in dashboard user can trigger these routes from the dev controls without exposing `CRON_SECRET` to the browser.

- `POST /api/calls/generate` creates today's pending call logs and returns created/skipped counts.
- `POST /api/calls/process` processes due pending call logs and returns outcome counts.
- `POST /api/calls/process-one` processes one call log for development testing.
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

## Retry and Alert Rules

- `snoozed`: creates a retry call after `voice_settings.retry_delay_minutes`; no alert is created immediately.
- `no_answer`: creates a retry while `retry_count < voice_settings.max_retries`; after retries are exhausted, creates a medium `no_answer` alert.
- `missed`: creates a high `missed_medicine` alert.
- `need_help`: creates a critical `need_help` alert with the parent phone number in the message.

Generated call logs are idempotent. The database migration adds a unique index for the same `caregiver_id`, `parent_id`, `medicine_schedule_id`, and `scheduled_for` when historical data is already clean; the service also checks for an existing log before insert.

## Native-Language Scripts and TTS v1

Call logs now store a deterministic medicine reminder script when they are generated. Scripts are rule-based templates, not LLM output, so reminders stay predictable and avoid hallucinated medical advice.

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

TTS is provider-based and safe by default:

- `TTS_PROVIDER=mock` marks audio as `mock_generated` without calling an external API.
- `TTS_PROVIDER=google` and `TTS_PROVIDER=openai` are placeholders. If selected without required env vars, they return a clear failed result and do not crash the app.
- No voice cloning is implemented.

Audio routes:

- `POST /api/calls/generate-audio` generates audio metadata for one call log owned by the logged-in caregiver.
- `POST /api/calls/generate-pending-audio` processes call logs with `audio_status = not_generated`; cron protection uses `CRON_SECRET`.

Example local testing:

```bash
curl -X POST http://localhost:3000/api/calls/generate-audio \
  -H "Content-Type: application/json" \
  -d '{"callLogId":"CALL_LOG_ID"}'

curl -X POST http://localhost:3000/api/calls/generate-pending-audio \
  -H "Authorization: Bearer $CRON_SECRET"
```

In development, `/dashboard/calls` includes script previews, per-call mock audio generation, and batch pending audio generation. Audio is never autoplayed; a basic player only appears if a provider returns an `audio_url`.

## Project Structure

```text
app/                    App Router pages and layouts
components/auth/        Auth-related controls
components/dashboard/   Dashboard UI and page managers
components/forms/       Auth, parent, and medicine forms
components/layout/      Sidebar and mobile navigation
components/ui/          Reusable UI primitives
lib/call-scripts/       Rule-based native-language call templates
lib/tts-providers/      Mock and future TTS provider adapters
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
- Call Scheduling Engine v1 in safe simulation mode
- Native-language rule-based call scripts
- Mock TTS metadata generation
- Development controls for generating and processing call logs
- Alert read/unread handling

## Still Future Work

- Production cron configuration
- Exotel/Twilio outbound call creation
- DTMF capture and speech response handling
- Telephony webhook verification for callbacks
- Call recording storage and retention policy
- Real call status reconciliation
- Real Google/OpenAI TTS audio synthesis
- Audio storage and signed playback URLs
- Non-cloned production voice selection
- Payments
- Production validation and automated tests
