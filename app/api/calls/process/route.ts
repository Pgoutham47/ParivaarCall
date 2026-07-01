import { NextRequest, NextResponse } from "next/server";
import { getProtectedCronClient } from "@/lib/services/api-auth";
import { getPendingCalls, processPendingCall, summarizeProcessedResults } from "@/lib/services/call-engine";

export async function POST(request: NextRequest) {
  const protectedClient = await getProtectedCronClient(request);

  if (!protectedClient.ok) {
    return NextResponse.json({ error: protectedClient.message }, { status: protectedClient.status });
  }

  const pendingCalls = await getPendingCalls(protectedClient.supabase);
  const results = [];
  const errors: string[] = [];

  for (const call of pendingCalls) {
    try {
      results.push(await processPendingCall(protectedClient.supabase, call.id));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown processing error.");
    }
  }

  return NextResponse.json({
    ...summarizeProcessedResults(results),
    errors,
    mode: protectedClient.mode
  });
}
