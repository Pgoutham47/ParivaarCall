# ParivaarCall

A caregiver web app for managing medicine reminder calls to elderly parents.
Parents receive a normal phone call; they do not need an app.

The app supports parent and medicine management, scheduled reminders, call
history and recordings, dashboard alerts, adherence analytics, and voice settings.
Calls support **Telugu, English, Hindi, Tamil, and Kannada**.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase authentication and Postgres with row-level security
- Bolna for voice conversations through its default or connected calling line
- Vercel for the web app and API routes
- Supabase `pg_cron` for reminder scheduling; GitHub Actions for health and recovery

## Run locally

Use Node.js 22 or later.

```sh
npm ci
cp .env.example .env.local
# Fill in the Supabase values and server secrets in .env.local.
npm run dev
```

Open [localhost:3000](http://localhost:3000). Use `CALL_PROVIDER=simulated` for
local work without real phone calls. `APP_TIMEZONE=Asia/Kolkata` controls reminder
timing. Keep `.env.local` private; `.env.example` documents all configuration keys.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Check source code with the shared ESLint configuration |
| `npm test` | Run regression tests without placing calls |
| `npm run build` | Build the app and check types |
| `npm start` | Serve the production build |
| `npm run brand:sync` | Copy approved logo masters into `public/brand` |

## Project layout

| Folder | Contents |
| --- | --- |
| `app/` | Pages and server API routes |
| `components/` | Forms, dashboard controls, and shared UI |
| `lib/` | Call engine, language templates, validation, and Supabase services |
| `config/` | Reviewed multilingual agent configuration |
| `supabase/migrations/` | Ordered database schema, security, and scheduler migrations |
| `scripts/` | Focused verification, agent configuration, branding, and recovery tools |
| `tests/` | Regression tests |
| `public/brand/` | Approved assets served by the app |
| `marketing/brand/` | Approved logo masters and usage notes |
| `docs/` | Voice configuration and production operations |
| `.github/workflows/` | Hosted health checks and encrypted backup verification |

`backups/` and `reports/` are private/generated local output and are ignored by
Git and deployment. Installed dependencies and build output are ignored too.

## Database and deployment

1. Create a Supabase project and enable email/password sign-in.
2. Apply migrations **001–004** in order from `supabase/migrations/`.
3. Configure the environment variables in Vercel and deploy the app. There is no
   separate backend: `app/api/` contains the server routes.
4. Enable Supabase `pg_cron` and `pg_net`. In migration **005**, replace the
   placeholder app URL and cron secret before running it.
5. Apply migrations **006–008** in order. They set minute-level processing,
   production security safeguards, and restricted operations/recovery functions.
6. Configure the calling agent and its webhook as described in
   [the voice guide](docs/bolna-agent-prompt.md). Set `CALL_PROVIDER=bolna` only
   when the agent, webhook, and recipient verification are ready.

Existing deployments already have these migrations. Do not rerun migrations
blindly or edit migrations that have already been applied.

All family records are scoped to their caregiver. Only server-side code can
queue, claim, or finalize calls. The service-role key and cron/webhook secrets
must remain server-only.

## Calling behavior

The scheduler creates the day's reminders at **00:15 IST**, processes due calls
**every minute**, and reconciles missing results **every 15 minutes**. Saving a
medicine also creates any remaining reminders for today. Daily and weekly
schedules are supported; weekly uses the start date's weekday.

Language and speaking style are loaded just before dialing, including queued
reminders and one-time tests. A caregiver can override the language or use each
parent's preference. Formal greetings use the person's name; warm greetings use
the family relationship. Callers can request another configured language.

The app owns retry count and timing. Paused, changed, deleted, expired, or
unverified work cannot place a call. Duplicate claims and duplicate callbacks
are guarded. One-time test calls require confirmation and never retry.

`FREE_TIER_CALLING=true` restricts live calls to the account's verified-number
allowlist. `VERIFIED_CALL_NUMBERS` is server-only JSON mapping caregiver IDs to
verified E.164 numbers. Saving a parent's phone number does not verify it.

The webhook waits for the provider's final `completed` result. A
`call-disconnected` event is intermediate. Confirmations, deferrals, help requests,
and unanswered calls become call-history outcomes, with retries or dashboard
alerts where appropriate. Email is optional and remains disabled while
`RESEND_API_KEY` is empty.

## Operations and verification

- [Production operations and recovery](docs/operations.txt): hourly health
  checks, daily encrypted backups at 02:17 IST, 30-day backup retention, recovery
  key storage, and restore procedures.
- [Voice configuration](docs/bolna-agent-prompt.md): reviewed prompts, language
  voices, interruption and hangup settings, provider readback, and listening-test
  limitations.
- [Brand guide](marketing/brand/README.md): approved assets and synchronization.

The focused integration scripts use temporary accounts and simulated calls:
`scripts/check-production.mjs` targets a local production server on port 3001;
`scripts/check-voice-settings.mjs` checks settings persistence and dispatch.
Their headers and the voice guide describe the required environment. They create
`reports/` when needed and remove their test accounts afterward.

Real-call listening checks require an authorized recipient. Load testing and
full infrastructure failover remain deferred. Neither passing automated tests
nor saved agent settings guarantees perfect speech or uninterrupted service.

## Presentation demo

The shared presentation account is marked by `lib/demo-account.ts`. Its active
sample schedules are visible for exploration, but generation, real/test calling,
retries, and notifications are disabled independently of the calling plan.
History has final outcomes only, with no provider execution IDs or queued calls.
Generated conversation audio retains its provenance in `audio_provider`; it is
separate from real Bolna recordings and uses built-in neural voices.

Preview the initial dataset with
`node --env-file=.env.local --import tsx scripts/seed-presentation-demo.mjs`.
After deploying the guards, add `--apply` to populate the empty demo account.
The script verifies the deployed call block, checks the exact account identity,
backs up existing settings, and refuses to overwrite visitor activity.
Credentials stay in the ignored private backup folder, never in source control.

To prepare conversation audio, export the account's transcripts with
`node --env-file=.env.local --import tsx scripts/add-presentation-audio.mjs --export`.
Run `python3 scripts/generate-presentation-audio.py --generate` with `edge-tts`
and FFmpeg installed. It reuses identical utterances, creates separate speaker
voices, and saves MP3 assets under `public/audio/conversations/`.
Deploy those assets, then run the add-audio script with `--apply`; without the flag
it only previews the attachment plan. It backs up existing rows and verifies all
published audio URLs before attaching them. Live calling stays disabled.

## Archived creative work

Historical posters, reels, branding explorations, market research, and the old
agent brief are preserved outside this application folder in
`../ParivaarCall-archive-2026-10-28/`. Its README and cleanup manifest record what
was moved. Approved logo masters remain in this repository.
