import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CircleAlert,
  PhoneMissed,
  PhoneOff,
} from "lucide-react";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { HistoryPagination } from "@/components/dashboard/calls/HistoryPagination";
import { MarkAlertReadButton } from "@/components/dashboard/calls/MarkAlertReadButton";
import { RefreshPageButton } from "@/components/dashboard/calls/RefreshPageButton";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listAlerts } from "@/lib/services/calls-alerts";
import { createClient } from "@/lib/supabase/server";
import type { AlertSeverity, AlertType } from "@/lib/types";

export const metadata: Metadata = { title: "Family alerts" };

const severity: Record<
  AlertSeverity,
  { label: string; tone: "blue" | "amber" | "red" }
> = {
  low: { label: "For your attention", tone: "blue" },
  medium: { label: "Check in", tone: "amber" },
  high: { label: "Needs attention", tone: "red" },
  critical: { label: "Urgent attention", tone: "red" },
};
const alertIcon: Record<AlertType, typeof AlertTriangle> = {
  missed_medicine: AlertTriangle,
  no_answer: PhoneOff,
  need_help: CircleAlert,
  call_failed: PhoneMissed,
};

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(params.page) || 1)),
  );
  const supabase = await createClient();
  try {
    const rows = await listAlerts(supabase, page);
    const alerts = rows.slice(0, 25);
    const unread = alerts.filter((alert) => !alert.isRead).length;
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="A LITTLE EXTRA ATTENTION"
          title="Family alerts"
          description="Know when a reminder needs follow-up or a parent asks for help."
        />
        <AutoRefresh />
        {alerts.length === 0 ? (
          <Card className="px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 text-sage-600">
              <Bell className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-care-ink">
              {page > 1
                ? "No older alerts here"
                : "Nothing needs your attention here"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-sage-600">
              {page > 1
                ? "Return to the latest alerts to stay up to date."
                : "If a call goes unanswered or your parent asks for help, an update will appear here. You can check every outcome in Call history."}
            </p>
            <LinkButton
              href={page > 1 ? "/dashboard/alerts" : "/dashboard/calls"}
              className="mt-6"
              variant="secondary"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {page > 1 ? "Latest alerts" : "View call history"}
            </LinkButton>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sage-100 px-5 py-4 sm:px-6">
              <p className="text-sm font-semibold text-care-ink">
                Recent updates
              </p>
              <p className="text-xs text-sage-600">
                {unread} unread on this page
              </p>
            </div>
            <div className="divide-y divide-sage-100">
              {alerts.map((alert) => {
                const Icon = alertIcon[alert.type] ?? Bell;
                return (
                  <article
                    key={alert.id}
                    className={`flex gap-3 p-5 sm:gap-4 sm:px-6 ${alert.isRead ? "" : "bg-sage-50/40"}`}
                  >
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${alert.type === "need_help" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h2 className="text-sm font-semibold leading-6 text-care-ink">
                          {alert.title}
                        </h2>
                        <StatusBadge {...severity[alert.severity]} />
                        {!alert.isRead ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-700">
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-sage-600"
                              aria-hidden="true"
                            />
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium text-sage-700">
                        {alert.parentName}
                      </p>
                      <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-sage-600">
                        {alert.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-sage-500">
                          {alert.createdAt}
                        </p>
                        {alert.isRead ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-sage-500">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Read
                          </span>
                        ) : (
                          <MarkAlertReadButton alertId={alert.id} />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </Card>
        )}
        <HistoryPagination
          page={page}
          hasNext={rows.length > 25}
          count={alerts.length}
          path="/dashboard/alerts"
        />
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="A LITTLE EXTRA ATTENTION"
          title="Family alerts"
          description="Know when a reminder needs follow-up or a parent asks for help."
        />
        <Card className="space-y-4">
          <h2 className="section-title">We couldn’t load your alerts</h2>
          <p className="text-sm leading-6 text-sage-700">
            Please check your connection and try again.
          </p>
          <RefreshPageButton />
        </Card>
      </div>
    );
  }
}
