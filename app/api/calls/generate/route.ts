import { NextRequest, NextResponse } from "next/server";
import { getProtectedCronClient } from "@/lib/services/api-auth";
import { generateTodayCallLogs } from "@/lib/services/call-engine";

export async function POST(request: NextRequest) {
  try {
    const protectedClient = await getProtectedCronClient(request);

    if (!protectedClient.ok) {
      return NextResponse.json({ error: protectedClient.message }, { status: protectedClient.status });
    }

    const summary = await generateTodayCallLogs(protectedClient.supabase);

    return NextResponse.json({ ...summary, mode: protectedClient.mode });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not generate call logs. Make sure all Supabase migrations have been applied."
      },
      { status: 500 }
    );
  }
}
