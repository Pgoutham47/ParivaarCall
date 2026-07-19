import { NextRequest, NextResponse } from "next/server";
import { isExecutionInProgress, toCallResult, type BolnaExecutionPayload } from "@/lib/call-providers/bolna-results";
import { getProtectedCronClient } from "@/lib/services/api-auth";
import { finalizeCallResult, getStuckCallingLogs } from "@/lib/services/call-engine";

// A call sitting in "calling" longer than this is checked against Bolna.
const RECONCILE_AFTER_MINUTES = 10;
// After this long with no completed execution, stop waiting and mark it failed
// so retries/alerts fire instead of the reminder silently disappearing.
const GIVE_UP_AFTER_MINUTES = 60;

const DEFAULT_BOLNA_API_URL = "https://api.bolna.ai";

async function fetchExecution(providerCallId: string): Promise<{ ok: true; payload: BolnaExecutionPayload } | { ok: false; notFound: boolean; message: string }> {
  const apiKey = process.env.BOLNA_API_KEY;

  if (!apiKey) {
    return { ok: false, notFound: false, message: "BOLNA_API_KEY is not configured." };
  }

  const apiUrl = process.env.BOLNA_API_URL ?? DEFAULT_BOLNA_API_URL;
  const response = await fetch(`${apiUrl}/executions/${encodeURIComponent(providerCallId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (response.status === 404) {
    return { ok: false, notFound: true, message: `Execution ${providerCallId} not found.` };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { ok: false, notFound: false, message: `Bolna execution lookup failed (${response.status}): ${body.slice(0, 200)}` };
  }

  const payload = (await response.json().catch(() => null)) as BolnaExecutionPayload | null;

  if (!payload) {
    return { ok: false, notFound: false, message: "Bolna execution response was not valid JSON." };
  }

  return { ok: true, payload };
}

async function handle(request: NextRequest) {
  const protectedClient = await getProtectedCronClient(request);

  if (!protectedClient.ok) {
    return NextResponse.json({ error: protectedClient.message }, { status: protectedClient.status });
  }

  const supabase = protectedClient.supabase;
  const stuck = await getStuckCallingLogs(supabase, RECONCILE_AFTER_MINUTES);
  const now = Date.now();

  let finalized = 0;
  let stillInProgress = 0;
  let gaveUp = 0;
  const errors: string[] = [];

  for (const callLog of stuck) {
    const startedAt = callLog.call_started_at ? new Date(callLog.call_started_at).getTime() : now;
    const isPastGiveUp = now - startedAt > GIVE_UP_AFTER_MINUTES * 60 * 1000;

    try {
      const lookup = callLog.provider_call_id
        ? await fetchExecution(callLog.provider_call_id)
        : ({ ok: false, notFound: true, message: "Call log has no provider call id." } as const);

      if (lookup.ok && !isExecutionInProgress(lookup.payload.status)) {
        // The execution finished but the webhook never landed: apply the same
        // enrichment and classification the webhook would have.
        const recordingUrl = lookup.payload.telephony_data?.recording_url ?? null;
        const { error: enrichError } = await supabase
          .from("call_logs")
          .update({
            transcript: lookup.payload.transcript ?? null,
            ...(recordingUrl
              ? { audio_url: recordingUrl, audio_status: "generated", audio_provider: "bolna", audio_generated_at: new Date().toISOString() }
              : {})
          })
          .eq("id", callLog.id);

        if (enrichError) {
          throw new Error(enrichError.message);
        }

        // Guarded: a late webhook may be finalizing this same call right now.
        const applied = await finalizeCallResult(supabase, callLog.id, toCallResult(lookup.payload), {
          onlyIfStatusIn: ["calling", "pending"]
        });

        if (applied) {
          finalized += 1;
        }

        continue;
      }

      if (!isPastGiveUp) {
        if (!lookup.ok && !lookup.notFound) {
          errors.push(lookup.message);
        } else {
          stillInProgress += 1;
        }
        continue;
      }

      const gaveUpResult = await finalizeCallResult(
        supabase,
        callLog.id,
        {
          status: "failed",
          responseType: "no_response",
          notes: lookup.ok
            ? `Call was still "${lookup.payload.status}" after ${GIVE_UP_AFTER_MINUTES} minutes; marked failed by reconciliation.`
            : `No call result after ${GIVE_UP_AFTER_MINUTES} minutes (${lookup.message}); marked failed by reconciliation.`
        },
        { onlyIfStatusIn: ["calling", "pending"] }
      );

      if (gaveUpResult) {
        gaveUp += 1;
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown reconciliation error.");
    }
  }

  return NextResponse.json({
    checked: stuck.length,
    finalized,
    stillInProgress,
    gaveUp,
    errors,
    mode: protectedClient.mode
  });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

// Vercel cron invokes routes with GET.
export async function GET(request: NextRequest) {
  return handle(request);
}
