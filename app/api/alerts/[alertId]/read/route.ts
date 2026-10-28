import { NextRequest, NextResponse } from "next/server";
import { authenticatedUser, validId } from "@/lib/services/user-api";

export async function POST(request: NextRequest, { params }: { params: Promise<{ alertId: string }> }) {
  const auth = await authenticatedUser(request);
  if (!auth) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { alertId } = await params;
  if (!validId(alertId)) return NextResponse.json({ error: "Invalid alert." }, { status: 400 });
  const { data, error } = await auth.supabase.from("alerts").update({ is_read: true }).eq("id", alertId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update this alert. Please try again." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Alert not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
