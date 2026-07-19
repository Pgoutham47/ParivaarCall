import { NextRequest, NextResponse } from "next/server";
import { isExecutionInProgress, toCallResult, type BolnaExecutionPayload } from "@/lib/call-providers/bolna-results";
import { finalizeCallResult, findCallLogByProviderCallId } from "@/lib/services/call-engine";
import { createAdminClient } from "@/lib/supabase/admin";

function verifyWebhookSecret(request: NextRequest) {
  const configuredSecret = process.env.BOLNA_WEBHOOK_SECRET;

  if (!configuredSecret) {
    // Without a configured secret the webhook is only usable in development.
    return process.env.NODE_ENV !== "production";
  }

  // The query-param form stays supported because the Bolna dashboard only
  // accepts a plain URL for the webhook; prefer the header when possible.
  const provided =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("x-bolna-secret") ??
    request.nextUrl.searchParams.get("secret");

  return provided === configuredSecret;
}

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as BolnaExecutionPayload | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    // Bolna's exact payload shape is undocumented; log it while wiring up.
    console.log("[bolna webhook] raw payload:", JSON.stringify(payload, null, 2));
  }

  const providerCallId = payload.execution_id ?? payload.id ?? payload.call_id;

  if (!providerCallId) {
    return NextResponse.json({ error: "Webhook payload is missing an execution id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  let callLog = await findCallLogByProviderCallId(supabase, String(providerCallId));

  if (!callLog) {
    // Fallback: the call log id travels through the agent's context variables.
    const contextCallLogId =
      payload.user_data?.call_log_id ?? payload.context_details?.recipient_data?.call_log_id;

    if (typeof contextCallLogId === "string" && contextCallLogId.length > 0) {
      const { data } = await supabase.from("call_logs").select("*").eq("id", contextCallLogId).maybeSingle();
      callLog = data as typeof callLog;
    }
  }

  if (!callLog) {
    return NextResponse.json({ error: "No call log matches this Bolna execution." }, { status: 404 });
  }

  if (callLog.call_status !== "calling" && callLog.call_status !== "pending") {
    return NextResponse.json({ ok: true, callLogId: callLog.id, status: callLog.call_status, note: "Already finalized." });
  }

  const recordingUrl = payload.telephony_data?.recording_url ?? null;
  const { error: enrichError } = await supabase
    .from("call_logs")
    .update({
      // Never overwrite a transcript or recording we already have with a null
      // from an earlier event.
      ...(payload.transcript ? { transcript: payload.transcript } : {}),
      call_provider: "bolna",
      provider_call_id: String(providerCallId),
      ...(recordingUrl
        ? { audio_url: recordingUrl, audio_status: "generated", audio_provider: "bolna", audio_generated_at: new Date().toISOString() }
        : {})
    })
    .eq("id", callLog.id);

  if (enrichError) {
    return NextResponse.json({ error: enrichError.message }, { status: 500 });
  }

  // Bolna also emits events while the call is still queued, ringing, or in
  // progress. Finalizing on one of those would close the call seconds after it
  // started and, worse, make the app ignore the real outcome that arrives
  // later - including a parent asking for help.
  if (isExecutionInProgress(payload.status)) {
    return NextResponse.json({
      ok: true,
      callLogId: callLog.id,
      status: "calling",
      note: `Ignored in-progress event "${payload.status}".`
    });
  }

  const result = toCallResult(payload);

  // "missed" is the fallback for a payload we could not interpret. Log the
  // status in production too, otherwise a misconfigured agent looks exactly
  // like a parent who stayed silent.
  if (result.status === "missed" && !payload.extracted_data && !payload.transcript) {
    console.warn(
      `[bolna webhook] unrecognized terminal payload; defaulting to missed. status="${payload.status}" execution=${providerCallId}`
    );
  }

  // Claim the row: Bolna can deliver the same result twice, and the reconcile
  // job may be finalizing the same call concurrently.
  const finalized = await finalizeCallResult(supabase, callLog.id, result, {
    onlyIfStatusIn: ["calling", "pending"]
  });

  if (!finalized) {
    return NextResponse.json({ ok: true, callLogId: callLog.id, note: "Already finalized by another delivery." });
  }

  return NextResponse.json({
    ok: true,
    callLogId: callLog.id,
    status: finalized.status,
    responseType: finalized.responseType,
    retryCreated: finalized.retryCreated,
    alertCreated: finalized.alertCreated
  });
}
