import { NextRequest, NextResponse } from "next/server";
import { getProtectedCronClient } from "@/lib/services/api-auth";
import { generatePendingAudio } from "@/lib/services/tts";

export async function POST(request: NextRequest) {
  const protectedClient = await getProtectedCronClient(request);

  if (!protectedClient.ok) {
    return NextResponse.json({ error: protectedClient.message }, { status: protectedClient.status });
  }

  const summary = await generatePendingAudio(protectedClient.supabase);

  return NextResponse.json({ ...summary, mode: protectedClient.mode });
}
