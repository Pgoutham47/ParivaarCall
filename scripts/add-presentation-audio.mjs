// Attach locally prepared conversation audio only to the protected presentation account.
// node --env-file=.env.local --import tsx scripts/add-presentation-audio.mjs [--export | --apply]
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNT_ID } from "../lib/demo-account.ts";

const apply = process.argv.includes("--apply");
const exportSource = process.argv.includes("--export");
assert(
  process.argv
    .slice(2)
    .every((flag) => ["--apply", "--export"].includes(flag)) &&
    !(apply && exportSource),
  "Use --export or --apply separately.",
);
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const ok = async (query) => {
  const result = await query;
  if (result.error) throw result.error;
  return result.data;
};
const { user } = await ok(db.auth.admin.getUserById(DEMO_ACCOUNT_ID));
assert.equal(user.app_metadata?.purpose, "presentation-demo");
assert.equal(user.email, "demo@parivaarcall.test");
const calls = await ok(
  db
    .from("call_logs")
    .select("*")
    .eq("caregiver_id", DEMO_ACCOUNT_ID)
    .eq("call_provider", "presentation_demo"),
);
if (exportSource) {
  mkdirSync("reports", { recursive: true });
  const source = calls
    .filter(
      (row) =>
        row.transcript &&
        !["no_answer", "failed", "pending", "calling"].includes(
          row.call_status,
        ),
    )
    .map(({ id, transcript, script_language, call_status }) => ({
      id,
      transcript: transcript.replace(
        /^\[Illustrative demo transcript[^\n]*\]\n/,
        "",
      ),
      script_language,
      call_status,
    }));
  writeFileSync(
    "reports/presentation-audio-source.json",
    JSON.stringify({ accountId: DEMO_ACCOUNT_ID, calls: source }, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify({ exportedConversations: source.length }));
  process.exit(0);
}
const manifest = JSON.parse(
  readFileSync("reports/presentation-audio-manifest.json", "utf8"),
);
assert.equal(manifest.accountId, DEMO_ACCOUNT_ID);
const alerts = await ok(
  db.from("alerts").select("*").eq("caregiver_id", DEMO_ACCOUNT_ID),
);
const schedules = await ok(
  db.from("medicine_schedules").select("*").eq("caregiver_id", DEMO_ACCOUNT_ID),
);
const updates = calls.map((call) => {
  const audio = manifest.calls.find((item) => item.id === call.id);
  assert(
    !audio ||
      (call.transcript &&
        !["no_answer", "failed", "pending", "calling"].includes(
          call.call_status,
        )),
  );
  const transcript =
    call.transcript?.replace(/^\[Illustrative demo transcript[^\n]*\]\n/, "") ??
    null;
  if (audio)
    assert.equal(
      transcript,
      audio.transcript,
      "The audio must match the saved transcript.",
    );
  return {
    id: call.id,
    changes: {
      transcript,
      script_text:
        call.script_text?.replace(/^\[Demo conversation[^\n]*\]\n/, "") ?? null,
      notes:
        call.notes
          ?.replace(/^\[Presentation demo\]\s*/, "")
          .replace(
            "No answer in this sample attempt.",
            "The call was not answered.",
          )
          .replace(
            "Example of an unsuccessful call.",
            "The call could not connect.",
          )
          .replace(
            "Medicine not confirmed in this example.",
            "Medicine was not confirmed.",
          ) ?? null,
      ...(audio
        ? {
            audio_url: audio.path,
            audio_status: "generated",
            audio_provider: manifest.provider,
            audio_generated_at: manifest.generatedAt,
          }
        : {}),
    },
  };
});
assert.equal(
  updates.filter((row) => row.changes.audio_url).length,
  manifest.calls.length,
);
const paths = [...new Set(manifest.calls.map((row) => row.path))];
for (const path of paths) {
  assert(/^\/audio\/conversations\/[a-z0-9-]+\.mp3$/.test(path));
  assert(
    readFileSync(`public${path}`).length > 5000,
    "Missing or invalid local audio.",
  );
}
if (!apply) {
  console.log(
    JSON.stringify({
      mode: "preview",
      conversations: manifest.calls.length,
      audioFiles: paths.length,
      callsPlaced: 0,
    }),
  );
  process.exit(0);
}
for (const path of paths) {
  const response = await fetch(`https://parivaar-call.vercel.app${path}`, {
    method: "HEAD",
    signal: AbortSignal.timeout(15000),
  });
  assert(
    response.ok && response.headers.get("content-type")?.startsWith("audio/"),
    `Deploy audio asset first: ${path}`,
  );
}
mkdirSync("backups", { recursive: true, mode: 0o700 });
writeFileSync(
  `backups/presentation-audio-before-${Date.now()}.json`,
  JSON.stringify({ calls, alerts, schedules }, null, 2),
  { mode: 0o600, flag: "wx" },
);
for (const { id, changes } of updates)
  await ok(
    db
      .from("call_logs")
      .update(changes)
      .eq("id", id)
      .eq("caregiver_id", DEMO_ACCOUNT_ID)
      .eq("call_provider", "presentation_demo"),
  );
for (const row of alerts) {
  const message =
    row.message
      ?.replace(/^Demo example: /, "")
      .replace(
        "This example shows how a request for family support appears.",
        "Requested a check-in from a family member.",
      )
      .replace(
        "This example shows an unsuccessful connection.",
        "The reminder could not connect.",
      )
      .replace(
        "This example shows a reminder without confirmation.",
        "The medicine reminder was not confirmed.",
      )
      .replace(" No real person needs follow-up.", "") ?? null;
  await ok(
    db
      .from("alerts")
      .update({ message })
      .eq("id", row.id)
      .eq("caregiver_id", DEMO_ACCOUNT_ID),
  );
}
for (const row of schedules) {
  if (
    row.dosage_instruction ===
    "Demo instruction only — follow the caregiver’s saved prescription."
  )
    await ok(
      db
        .from("medicine_schedules")
        .update({
          dosage_instruction:
            "Follow the caregiver’s saved prescription instructions.",
        })
        .eq("id", row.id)
        .eq("caregiver_id", DEMO_ACCOUNT_ID),
    );
}
const saved = await ok(
  db
    .from("call_logs")
    .select("id,audio_url,audio_provider,call_status")
    .eq("caregiver_id", DEMO_ACCOUNT_ID)
    .eq("call_provider", "presentation_demo"),
);
assert(saved.every((row) => !["pending", "calling"].includes(row.call_status)));
assert.equal(
  saved.filter((row) => row.audio_url).length,
  manifest.calls.length,
);
console.log(
  JSON.stringify({
    updated: true,
    conversations: manifest.calls.length,
    audioFiles: paths.length,
    realCallsPlaced: 0,
  }),
);
