import { NextRequest, NextResponse } from "next/server";
import { getProtectedCronClient } from "@/lib/services/api-auth";
import { isSimulatedResponse, processPendingCall } from "@/lib/services/call-engine";

export async function POST(request: NextRequest) {
  const protectedClient = await getProtectedCronClient(request);

  if (!protectedClient.ok) {
    return NextResponse.json({ error: protectedClient.message }, { status: protectedClient.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    callLogId?: unknown;
    simulatedResponse?: unknown;
  };

  if (typeof body.callLogId !== "string") {
    return NextResponse.json({ error: "callLogId is required." }, { status: 400 });
  }

  if (body.simulatedResponse !== undefined && !isSimulatedResponse(body.simulatedResponse)) {
    return NextResponse.json({ error: "Invalid simulatedResponse." }, { status: 400 });
  }

  const result = await processPendingCall(protectedClient.supabase, body.callLogId, {
    simulatedResponse: body.simulatedResponse
  });

  if (!result) {
    return NextResponse.json(
      { error: "Call log is not pending. It was already processed or a call is in progress." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    callLogId: result.callLog.id,
    status: result.status,
    responseType: result.responseType,
    retryCreated: result.retryCreated,
    alertCreated: result.alertCreated,
    providerCallId: result.providerCallId ?? null,
    mode: protectedClient.mode
  });
}
