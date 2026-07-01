import { AlertTriangle, CircleAlert, PhoneOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarkAlertReadButton } from "@/components/dashboard/calls/MarkAlertReadButton";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listAlerts } from "@/lib/services/calls-alerts";
import { createClient } from "@/lib/supabase/server";
import type { AlertSeverity, AlertType } from "@/lib/types";

const severityTone: Record<AlertSeverity, "green" | "amber" | "red" | "blue" | "neutral"> = {
  low: "blue",
  medium: "amber",
  high: "red",
  critical: "red"
};

const alertIcon: Record<AlertType, typeof AlertTriangle> = {
  missed_medicine: AlertTriangle,
  no_answer: PhoneOff,
  need_help: CircleAlert
};

const alertSurface: Record<AlertSeverity, string> = {
  low: "border-sky-100 bg-sky-50/60",
  medium: "border-amber-100 bg-amber-50/60",
  high: "border-rose-100 bg-rose-50/60",
  critical: "border-rose-200 bg-rose-100/70"
};

export default async function AlertsPage() {
  const supabase = await createClient();

  try {
    const alerts = await listAlerts(supabase);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Attention"
          title="Alerts"
          description="Prioritized signals for missed medicine, no answer, and need help responses."
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {alerts.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <p className="text-base font-semibold text-care-ink">No alerts yet</p>
              <p className="mt-2 text-sm leading-6 text-sage-700">When a call is missed or a parent asks for help, alerts will appear here.</p>
            </Card>
          ) : (
            alerts.map((alert) => {
              const Icon = alertIcon[alert.type] ?? AlertTriangle;
              return (
                <Card key={alert.id} className={alertSurface[alert.severity]}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sage-800 shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusBadge label={alert.severity} tone={severityTone[alert.severity]} />
                      <StatusBadge label={alert.isRead ? "read" : "unread"} tone={alert.isRead ? "neutral" : "amber"} />
                    </div>
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-care-ink">{alert.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-sage-800">{alert.parentName}</p>
                  <p className="mt-3 text-sm leading-6 text-sage-700">{alert.description}</p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">{alert.createdAt}</p>
                  {!alert.isRead ? <MarkAlertReadButton alertId={alert.id} /> : null}
                </Card>
              );
            })
          )}
        </section>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load alerts.";

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Attention"
          title="Alerts"
          description="Prioritized signals for missed medicine, no answer, and need help responses."
        />
        <Card>
          <p className="text-base font-semibold text-care-ink">Alerts unavailable</p>
          <p className="mt-2 text-sm leading-6 text-sage-700">{message}</p>
        </Card>
      </div>
    );
  }
}
