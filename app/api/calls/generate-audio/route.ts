import { NextRequest, NextResponse } from "next/server";
import { generateAudioForCallLog } from "@/lib/services/tts";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { callLogId?: unknown };

  if (typeof body.callLogId !== "string") {
    return NextResponse.json({ error: "callLogId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { result, callLog } = await generateAudioForCallLog(supabase, body.callLogId);

  return NextResponse.json({
    callLogId: callLog.id,
    audioUrl: result.audioUrl ?? null,
    audioStatus: result.audioStatus,
    audioProvider: result.provider,
    error: result.error ?? null
  });
}
