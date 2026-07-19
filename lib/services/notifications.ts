import { createAdminClient } from "@/lib/supabase/admin";

// Email notification for a newly created alert. Failures never propagate:
// a broken email provider must not break call finalization, so this returns
// a result object instead of throwing.
export type AlertEmailInput = {
  caregiverId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string | null;
  parentName: string;
};

export type NotificationResult = { sent: boolean; skipped?: boolean; reason?: string };

const RESEND_API_URL = "https://api.resend.com/emails";

const severityColor: Record<string, string> = {
  low: "#0369a1",
  medium: "#b45309",
  high: "#be123c",
  critical: "#9f1239"
};

function alertEmailHtml(input: AlertEmailInput, dashboardUrl: string | null) {
  const color = severityColor[input.severity] ?? "#334155";
  const link = dashboardUrl
    ? `<p style="margin:24px 0 0;"><a href="${dashboardUrl}/dashboard/alerts" style="color:#166534;font-weight:600;">Open the alerts dashboard</a></p>`
    : "";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937;">
    <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${color};font-weight:700;">${input.severity} alert</p>
    <h1 style="margin:8px 0 0;font-size:22px;color:#111827;">${input.title}</h1>
    <p style="margin:16px 0 0;font-size:15px;line-height:1.6;">${input.message ?? ""}</p>
    <p style="margin:16px 0 0;font-size:14px;color:#4b5563;">Parent: <strong>${input.parentName}</strong></p>
    ${link}
    <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;">Sent by Parivaar Call because a reminder call needed your attention.</p>
  </div>`;
}

export async function sendAlertEmail(input: AlertEmailInput): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { sent: false, skipped: true, reason: "RESEND_API_KEY is not configured." };
  }

  try {
    // Caregiver email lives in Supabase Auth, not in profiles.
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(input.caregiverId);
    const email = data?.user?.email;

    if (error || !email) {
      return { sent: false, reason: error?.message ?? "Caregiver has no email address." };
    }

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL ?? "Parivaar Call <onboarding@resend.dev>",
        to: [email],
        subject: `[${input.severity.toUpperCase()}] ${input.title} — ${input.parentName}`,
        html: alertEmailHtml(input, process.env.APP_URL ?? null)
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { sent: false, reason: `Resend request failed (${response.status}): ${body.slice(0, 200)}` };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "Unknown notification error." };
  }
}
