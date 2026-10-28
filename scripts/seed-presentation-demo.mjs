// Populate only the protected presentation account. Default mode is a read-only preview.
// Run after deploying the demo call guards:
// node --env-file=.env.local --import tsx scripts/seed-presentation-demo.mjs --apply
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  DEMO_ACCOUNT_ID,
  DEMO_CALLING_DISABLED_MESSAGE,
} from "../lib/demo-account.ts";
import {
  localDateKey,
  daysAgo,
  zonedDateTimeToUtc,
} from "../lib/services/timezone.ts";

const apply = process.argv.includes("--apply");
const allowed = new Set(["--apply"]);
if (process.argv.slice(2).some((arg) => !allowed.has(arg)))
  throw Error("Only --apply is supported.");
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const ok = async (query) => {
  const result = await query;
  if (result.error) throw result.error;
  return result.data;
};
const { user } = await ok(client.auth.admin.getUserById(DEMO_ACCOUNT_ID));
if (
  user.email !== "demo@parivaarcall.test" ||
  user.app_metadata?.purpose !== "presentation-demo"
)
  throw Error("Protected demo account identity did not match.");
const caregiver_id = DEMO_ACCOUNT_ID;
const now = new Date();
const id = (key) => {
  const h = createHash("sha256")
    .update(`parivaar-presentation-v1:${caregiver_id}:${key}`)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const initialDate = localDateKey(daysAgo(21, now));
const createdAt = zonedDateTimeToUtc(initialDate, "07:00:00").toISOString();
const base = { caregiver_id, created_at: createdAt };
const parents = [
  {
    id: id("lakshmi"),
    name: "Lakshmi Rao",
    relationship: "Mother",
    age: 61,
    language: "Telugu",
    city: "Hyderabad",
    phone: "+12025550111",
  },
  {
    id: id("raghav"),
    name: "Raghav Rao",
    relationship: "Father",
    age: 66,
    language: "Hindi",
    city: "Vijayawada",
    phone: "+12025550112",
  },
  {
    id: id("meera"),
    name: "Meera Rao",
    relationship: "Grandmother",
    age: 73,
    language: "Tamil",
    city: "Chennai",
    phone: "+12025550113",
  },
].map((row) => ({
  ...base,
  ...row,
  status: "active",
  emergency_contact_name: null,
  emergency_contact_phone: null,
}));
let weeklyStart = initialDate;
while (new Date(`${weeklyStart}T12:00:00Z`).getUTCDay() !== 0)
  weeklyStart = localDateKey(
    new Date(new Date(`${weeklyStart}T12:00:00Z`).getTime() - 86400000),
  );
const definitions = [
  [0, "Morning tablet", "08:00:00", "daily", "after_food", true],
  [0, "Evening tablet", "20:00:00", "daily", "after_food", false],
  [1, "Morning capsule", "08:30:00", "daily", "before_food", true],
  [1, "Afternoon tablet", "13:00:00", "daily", "after_food", false],
  [2, "Evening supplement", "19:00:00", "daily", "after_food", false],
  [2, "Weekly supplement", "09:00:00", "weekly", "after_food", false],
];
const schedules = definitions.map(
  ([parentIndex, name, time, frequency, food, important], index) => ({
    ...base,
    id: id(`medicine-${index}`),
    parent_id: parents[parentIndex].id,
    medicine_name: name,
    dosage_instruction:
      "Demo instruction only — follow the caregiver’s saved prescription.",
    scheduled_time: time,
    frequency,
    food_timing: food,
    is_important: important,
    start_date: frequency === "weekly" ? weeklyStart : initialDate,
    end_date: null,
    is_active: true,
  }),
);
const exceptions = {
  "1-1": ["no_answer", "no_answer", "no_answer"],
  "1-2": ["need_help"],
  "2-3": ["snoozed", "confirmed"],
  "3-4": ["failed"],
  "4-0": ["missed"],
  "5-2": ["no_answer", "confirmed"],
  "7-1": ["snoozed", "confirmed"],
  "8-4": ["no_answer", "no_answer", "no_answer"],
  "10-3": ["missed"],
  "12-0": ["snoozed", "confirmed"],
  "13-2": ["need_help"],
};
const speech = {
  Telugu: {
    prompt: "నమస్కారం. మీ మందు వేసుకునే సమయం అయ్యింది. వేసుకున్నారా?",
    confirmed: "అవును, వేసుకున్నాను.",
    snoozed: "కొంచెం సేపటి తర్వాత గుర్తు చేయండి.",
    need_help: "మా కుటుంబ సభ్యులతో మాట్లాడాలి.",
    missed: "ఇంకా వేసుకోలేదు.",
    close: "సరే. మీ సమాధానం నమోదు చేశాను. జాగ్రత్తగా ఉండండి.",
  },
  Hindi: {
    prompt: "नमस्ते। आपकी दवा लेने का समय हो गया है। आपने ले ली?",
    confirmed: "हाँ, मैंने ले ली है।",
    snoozed: "थोड़ी देर बाद याद दिलाइए।",
    need_help: "मुझे अपने परिवार से बात करनी है।",
    missed: "अभी नहीं ली है।",
    close: "ठीक है, आपका जवाब दर्ज कर लिया है। अपना ध्यान रखिए।",
  },
  Tamil: {
    prompt: "வணக்கம். மருந்து எடுக்க நேரம் ஆயிடுச்சு. எடுத்தீங்களா?",
    confirmed: "ஆமாம், எடுத்துக்கிட்டேன்.",
    snoozed: "கொஞ்ச நேரம் கழித்து நினைவூட்டுங்கள்.",
    need_help: "என் குடும்பத்தினரிடம் பேச வேண்டும்.",
    missed: "இன்னும் எடுக்கவில்லை.",
    close: "சரி, உங்கள் பதிலை பதிவு செய்துவிட்டேன். பார்த்துக்கொள்ளுங்கள்.",
  },
};
const calls = [];
const alerts = [];
for (let day = 14; day >= 1; day--) {
  const date = localDateKey(daysAgo(day, now));
  for (let index = 0; index < schedules.length; index++) {
    const schedule = schedules[index];
    if (
      schedule.frequency === "weekly" &&
      new Date(`${date}T12:00:00Z`).getUTCDay() !== 0
    )
      continue;
    const parent = parents.find((p) => p.id === schedule.parent_id);
    const text = speech[parent.language];
    const outcomes = exceptions[`${day}-${index}`] ?? ["confirmed"];
    let prior = null;
    for (const [retry, status] of outcomes.entries()) {
      const when = new Date(
        zonedDateTimeToUtc(date, schedule.scheduled_time).getTime() +
          retry * 10 * 60000,
      );
      const key = `${date}:${index}:${retry}`;
      const callId = id(`call:${key}`);
      const connected = !["no_answer", "failed"].includes(status);
      const response_type =
        status === "confirmed"
          ? "speech_taken"
          : status === "snoozed"
            ? "speech_later"
            : status === "need_help"
              ? "speech_help"
              : "no_response";
      calls.push({
        caregiver_id,
        id: callId,
        parent_id: parent.id,
        medicine_schedule_id: schedule.id,
        scheduled_for: when.toISOString(),
        call_started_at: when.toISOString(),
        call_ended_at: new Date(
          when.getTime() + (connected ? 42 : 25) * 1000,
        ).toISOString(),
        created_at: when.toISOString(),
        call_status: status,
        response_type,
        retry_count: retry,
        retry_parent_call_log_id: prior,
        script_language: parent.language,
        script_text: `[Demo conversation — no real call]\n${text.prompt}`,
        transcript: connected
          ? `[Illustrative demo transcript — no real call was placed]\nAssistant: ${text.prompt}\n${parent.name}: ${text[status]}\nAssistant: ${text.close}`
          : null,
        notes: `[Presentation demo] ${status === "confirmed" ? "Parent confirmed the reminder." : status === "no_answer" ? "No answer in this sample attempt." : status === "snoozed" ? "Requested a follow-up in ten minutes." : status === "need_help" ? "Asked for a family member to check in." : status === "failed" ? "Example of an unsuccessful call." : "Medicine not confirmed in this example."}`,
        call_provider: "presentation_demo",
        provider_call_id: null,
        audio_url: null,
        audio_status: "not_generated",
      });
      prior = callId;
    }
    const final = outcomes.at(-1);
    if (final !== "confirmed") {
      const type =
        final === "need_help"
          ? "need_help"
          : final === "no_answer"
            ? "no_answer"
            : final === "failed"
              ? "call_failed"
              : "missed_medicine";
      const title =
        final === "need_help"
          ? `${parent.name} asked for a check-in`
          : final === "no_answer"
            ? `${parent.name} did not answer`
            : final === "failed"
              ? "A reminder could not connect"
              : "A medicine reminder was not confirmed";
      alerts.push({
        id: id(`alert:${date}:${index}`),
        caregiver_id,
        parent_id: parent.id,
        medicine_schedule_id: schedule.id,
        alert_type: type,
        severity:
          final === "need_help"
            ? "critical"
            : final === "failed"
              ? "high"
              : "medium",
        title,
        message: `Demo example: ${parent.name} — ${schedule.medicine_name}. ${final === "need_help" ? "This example shows how a request for family support appears." : final === "no_answer" ? "The initial call and two follow-ups were unanswered." : final === "failed" ? "This example shows an unsuccessful connection." : "This example shows a reminder without confirmation."} No real person needs follow-up.`,
        is_read: day > 6,
        created_at: new Date(
          zonedDateTimeToUtc(date, schedule.scheduled_time).getTime() +
            outcomes.length * 10 * 60000,
        ).toISOString(),
      });
    }
  }
}
const expected = {
  parents: parents.length,
  medicineSchedules: schedules.length,
  callHistory: calls.length,
  alerts: alerts.length,
  unreadAlerts: alerts.filter((a) => !a.is_read).length,
  historyFrom: localDateKey(daysAgo(14, now)),
  historyThrough: localDateKey(daysAgo(1, now)),
};
if (!apply) {
  console.log(
    JSON.stringify(
      { mode: "preview", ...expected, realCallsPlaced: 0 },
      null,
      2,
    ),
  );
  process.exit(0);
}
// Refuse to seed active routines before the account-specific guards are deployed.
const credentials = JSON.parse(
  readFileSync("backups/presentation-demo-account.json", "utf8"),
);
if (credentials.id !== caregiver_id || credentials.email !== user.email)
  throw Error("Saved demo credentials do not match.");
const cookies = new Map();
const browserClient = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll: () => Array.from(cookies, ([name, value]) => ({ name, value })),
      setAll: (values) => {
        for (const c of values) cookies.set(c.name, c.value);
      },
    },
  },
);
await ok(
  browserClient.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  }),
);
const baseUrl = "https://parivaar-call.vercel.app";
try {
  // Empty body can never identify a recipient, even on a previous deployment.
  const response = await fetch(`${baseUrl}/api/calls/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
      Cookie: Array.from(cookies, ([name, value]) => `${name}=${value}`).join(
        "; ",
      ),
    },
    body: "{}",
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json();
  if (
    response.status !== 403 ||
    payload.error !== DEMO_CALLING_DISABLED_MESSAGE
  )
    throw Error(
      "Deploy demo account protections before seeding active schedules.",
    );
} finally {
  await browserClient.auth.signOut({ scope: "local" });
}
const snapshot = {};
for (const table of [
  "parents",
  "medicine_schedules",
  "call_logs",
  "alerts",
  "voice_settings",
])
  snapshot[table] = await ok(
    client.from(table).select("*").eq("caregiver_id", caregiver_id),
  );
const existingSamples = snapshot.call_logs.filter(
  (c) => c.call_provider === "presentation_demo",
);
if (existingSamples.length)
  throw Error(
    "This account already has presentation activity. Existing visitor edits were preserved; do not reseed blindly.",
  );
if (
  snapshot.parents.length ||
  snapshot.medicine_schedules.length ||
  snapshot.call_logs.length ||
  snapshot.alerts.length
)
  throw Error(
    "Account is no longer empty. Review existing activity before adding fixtures.",
  );
mkdirSync("backups", { recursive: true, mode: 0o700 });
writeFileSync(
  `backups/presentation-demo-before-seed-${now.toISOString().replaceAll(":", "-")}.json`,
  JSON.stringify(snapshot, null, 2) + "\n",
  { mode: 0o600, flag: "wx" },
);
await ok(client.from("parents").insert(parents));
// Keep schedules paused until every related record has been created and checked.
await ok(
  client
    .from("medicine_schedules")
    .insert(schedules.map((row) => ({ ...row, is_active: false }))),
);
const initialCalls = calls.filter((row) => row.retry_count === 0);
const retries = calls.filter((row) => row.retry_count > 0);
await ok(client.from("call_logs").insert(initialCalls));
for (const retry of [1, 2]) {
  const batch = retries.filter((row) => row.retry_count === retry);
  if (batch.length) await ok(client.from("call_logs").insert(batch));
}
await ok(client.from("alerts").insert(alerts));
if (!snapshot.voice_settings.length)
  await ok(
    client.from("voice_settings").insert({
      caregiver_id,
      preferred_language: "Parent preferred language",
      respect_mode: "casual",
      retry_delay_minutes: 10,
      max_retries: 2,
      email_enabled: false,
      whatsapp_enabled: false,
      sms_enabled: false,
    }),
  );
else
  await ok(
    client
      .from("voice_settings")
      .update({
        email_enabled: false,
        whatsapp_enabled: false,
        sms_enabled: false,
      })
      .eq("caregiver_id", caregiver_id),
  );
const { count, error } = await client
  .from("call_logs")
  .select("id", { head: true, count: "exact" })
  .eq("caregiver_id", caregiver_id)
  .in("call_status", ["pending", "calling"]);
if (error || count !== 0)
  throw Error("Unexpected queued calls: sample schedules remain paused.");
await ok(
  client
    .from("medicine_schedules")
    .update({ is_active: true })
    .eq("caregiver_id", caregiver_id)
    .in(
      "id",
      schedules.map((s) => s.id),
    ),
);
for (const [table, expectedCount] of Object.entries({
  parents: parents.length,
  medicine_schedules: schedules.length,
  call_logs: calls.length,
  alerts: alerts.length,
})) {
  const result = await client
    .from(table)
    .select("id", { head: true, count: "exact" })
    .eq("caregiver_id", caregiver_id);
  if (result.error || result.count !== expectedCount)
    throw Error(`Seed verification failed for ${table}.`);
}
mkdirSync("reports", { recursive: true });
const report = {
  seededAt: now.toISOString(),
  ...expected,
  liveCallsDisabled: true,
  queuedCalls: 0,
  realCallsPlaced: 0,
};
writeFileSync(
  "reports/presentation-demo-seed.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
