# Multilingual reminder agent

The reviewed configuration is in `config/bolna-conversation.json`. Apply it with
`node --env-file=.env.local scripts/configure-voice-agent.mjs --apply`.
Omit `--apply` for a read-only configuration audit. Neither command places calls.
The apply command saves private snapshots under ignored `backups/voice-agent-*`
before changing the live agent. Those snapshots include webhook credentials;
never commit or share them.

## Languages and speech

Telugu (`te`), English (`en`), Hindi (`hi`), Tamil (`ta`) and Kannada (`kn`) each
have a speech-recognition configuration, synthesis language, prompt, hand-in,
presence check and goodbye. The application sends `agent_data.language`, so a
saved language chooses the actual speech pipeline, not just the written script.
The starting language comes from the caregiver's override or the parent's choice.
The caller can explicitly ask to change language; incidental English words do
not automatically switch the conversation. Progress carries across switches.

Saaras v4 recognizes speech. Telugu uses Bulbul v4 Flash's Kavitha conversation
voice, English uses Zarina, Hindi uses Kavya conversational, and Kannada uses
Chaitra conversation. Tamil retains Bulbul v3 Kavya because the account's Tamil
v4 catalog currently offers narration/advertising voices. Each speaks at 1.0
speed with its own language code; the voice IDs were checked in the live catalog. Native-script templates preserve
medicine names, numeric doses and units. English brand names can remain English.
No voice cloning or pretending to be the child is used.

## Real settings

Language and respect mode are loaded immediately before dispatch, including
queued reminders and one-time tests. Formal greetings use the person's name;
warm greetings use their family relationship. Respect mode also reaches the
conversation prompt. The script actually spoken is saved in the call log.

Retry count and gap are applied by the app after the result. Reducing the count
also stops an outstanding retry above that limit. The gap affects newly created
retries; previously scheduled retry times stay unchanged. Retries require an
active schedule and stop at the end of the reminder day. Test calls never retry.
Bolna auto-rescheduling and per-call provider retries are disabled, avoiding a
second independent retry system. The agent must not promise an exact callback.

## Conversation and ending

The welcome contains one reminder question and is played once. The model is
instructed to listen, clarify ambiguous answers, respect interruptions, and
acknowledge once. It must not equate a greeting or future intention with taking
medicine. Test calls explicitly say no medicine is needed.

Conversation-based hangup is enabled. After the result is acknowledged, the
platform plays a localized farewell and disconnects. The model does not add
another goodbye. The farewell is interruptible for a correction or question.
A presence check starts at 15 seconds, at most once, with a 28-second silence
limit and a 180-second overall limit. Interruptions require two words, with
500 ms interruption backoff, 400 ms linear delay and 350 ms endpointing. Stop
words are still handled by the platform. Moderate noise cancellation is set to
70. These changes follow a real Telugu test in which a one-word interruption
cut an acknowledgement into a fragment and led to a silence-check detour.
These values need listening checks with the intended speakers before claiming
natural timing in every language. Voicemail detection remains off to avoid
prematurely disconnecting quiet older adults; unconfirmed calls never count as
medicine taken.

Medical questions are redirected to family or a clinician. Help takes priority.
The agent cannot dispatch emergency help or claim someone has been contacted.
Caregiver alerts remain dashboard-only. A request to end a call ends that call;
it does not automatically cancel future medicine schedules.

## Results and webhook

The agent-scoped `reminder_outcome` extraction classifies all five languages and
submitted keypad input as `taken`, `later`, `help`, or `no_response`. It accounts
for negation, corrections, wrong numbers and test role-play. The original
webhook and telephony configuration are preserved. The app waits for completed
post-call extraction; `call-disconnected` is still intermediate.

Per-call context: `call_log_id`, `parent_name`, `medicine_name`,
`dosage_instruction`, `scheduled_time`, `script_language`, `reminder_script`,
`retry_count`, `respect_mode`, `retry_delay_minutes`, `retries_remaining`,
`call_kind`. Names and instructions are treated as data, not agent instructions.

## Verification and limits

`npm test` checks scripts, numeric dose preservation, real request language
selection, settings context, and multilingual result handling.

`CALL_PROVIDER=simulated RESEND_API_KEY= node --env-file=.env.local --import tsx scripts/check-voice-settings.mjs`
checks actual settings persistence and call-engine behavior using a temporary
account and fictional number, then removes all test records. It never places a
real call. Requires the existing Supabase environment and writes a local report.

Configuration readback and simulations do not prove audio quality, carrier
behavior, native-speaker pronunciation, interruption timing or hangup timing.
Those need authorized live conversations. Load and infrastructure-failover tests
remain deferred at the user's request.

## Official references

- [Multilingual configuration](https://www.bolna.ai/docs/customizations/multilingual-config-reference)
- [Starting a call in a chosen language](https://www.bolna.ai/docs/customizations/start-call-in-language)
- [Conversation hangup](https://www.bolna.ai/docs/agent-setup/agent-tab#hangup-using-prompt)
- [Timing and interruption settings](https://www.bolna.ai/docs/agent-setup/engine-tab)
- [Multilingual system messages](https://www.bolna.ai/docs/customizations/auto-switch-multilingual-messages)
- [Sarvam voice configuration](https://www.bolna.ai/docs/sarvam-voice)

## First live listening check

The authorized Telugu test completed with structured confirmation, a saved
recording, and provider termination `agent_ended_call` / `end_call_tool`. The
user reported slow, artificial delivery. The transcript showed a fragmented
acknowledgement, a presence check, and an unnecessary repeat confirmation. The
configuration was then tuned as described above, with native acknowledgement
examples, no guessed sir/madam addresses, a rule to retain the established
answer across interruptions, and language-specific conversational voices.
The revised delivery still requires a new listening check; no claim of perfect
voice quality is made.
