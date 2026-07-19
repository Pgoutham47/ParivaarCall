import { NextRequest, NextResponse } from "next/server";
import { getProtectedCronClient } from "@/lib/services/api-auth";
import { getPendingCalls, processPendingCall, summarizeProcessedResults } from "@/lib/services/call-engine";

// Vercel cron invokes routes with GET.
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const protectedClient = await getProtectedCronClient(request);

  if (!protectedClient.ok) {
    return NextResponse.json({ error: protectedClient.message }, { status: protectedClient.status });
  }

  const pendingCalls = await getPendingCalls(protectedClient.supabase);
  const results = [];
  const errors: string[] = [];
  let skipped = 0;

  for (const call of pendingCalls) {
    try {
      const result = await processPendingCall(protectedClient.supabase, call.id);

      if (result) {
        results.push(result);
      } else {
        // Another worker claimed this call log between fetch and processing.
        skipped += 1;
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown processing error.");
    }
  }

  return NextResponse.json({
    ...summarizeProcessedResults(results),
    skipped,
    errors,
    mode: protectedClient.mode
  });
}
