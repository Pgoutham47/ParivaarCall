import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticatedUser, validId } from "@/lib/services/user-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { canCallNumber } from "@/lib/calling-access";
import { DEMO_CALLING_DISABLED_MESSAGE, isPresentationDemo } from "@/lib/demo-account";
import { processPendingCall } from "@/lib/services/call-engine";
import { callDescription } from "@/lib/call-display";
import { getOrCreateVoiceSettings } from "@/lib/services/settings";
import { resolveCallLanguage, testCallScripts } from "@/lib/voice-languages";

export async function POST(request: NextRequest) {
  const auth = await authenticatedUser(request);
  if (!auth) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (isPresentationDemo(auth.user.id)) return NextResponse.json({ error: DEMO_CALLING_DISABLED_MESSAGE }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!validId(body?.parentId)) return NextResponse.json({ error: "Choose a parent." }, { status: 400 });
  const { data: parent, error } = await auth.supabase.from("parents").select("*").eq("id", body.parentId).maybeSingle();
  if (error || !parent) return NextResponse.json({ error: "Parent not found." }, { status: 404 });
  if (parent.status !== "active") return NextResponse.json({ error: "Activate this parent before making a test call." }, { status: 409 });
  if (!canCallNumber(parent.phone, auth.user.id)) return NextResponse.json({ error: "Free-tier calling supports only verified numbers. Contact your account administrator to verify this number first." }, { status: 403 });
  const admin = createAdminClient();
  const { count, error: countError } = await admin.from("call_logs").select("id", { count: "exact", head: true }).eq("caregiver_id", auth.user.id).gte("call_started_at", new Date(Date.now() - 300000).toISOString());
  if (countError) return NextResponse.json({ error: "Unable to check call availability. Please try again." }, { status: 503 });
  if (count) return NextResponse.json({ error: "Please wait five minutes between test calls." }, { status: 429 });
  // A deterministic primary key claims a five-minute account-wide slot even
  // when two server instances receive simultaneous requests.
  const hash = createHash("sha256").update(`test:${auth.user.id}:${Math.floor(Date.now() / 300000)}`).digest("hex");
  const id = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
  const settings = await getOrCreateVoiceSettings(auth.supabase);
  const language = resolveCallLanguage(settings.languagePreference, parent.language);
  const { error: insertError } = await admin.from("call_logs").insert({ id, caregiver_id: auth.user.id, parent_id: parent.id, scheduled_for: new Date(Date.now() + 60000).toISOString(), call_status: "pending", retry_count: 0, script_language: language, script_text: testCallScripts[language], notes: "One-time test call. No medicine action is needed." });
  if (insertError) return NextResponse.json({ error: insertError.code === "23505" ? "A test call was already requested. Check Calls before trying again." : "Could not request the test call." }, { status: insertError.code === "23505" ? 429 : 503 });
  try {
    const result = await processPendingCall(admin, id);
    return NextResponse.json({ callLogId: id, status: result?.status ?? "calling", message: result?.status === "failed" ? callDescription("failed", result.callLog.notes) : "Test call requested. Follow its progress on the Calls page." }, { status: result?.status === "failed" ? 422 : 200 });
  } catch {
    return NextResponse.json({ error: "The call request is being checked. Open Calls before trying again; do not submit another call yet.", callLogId: id }, { status: 503 });
  }
}
