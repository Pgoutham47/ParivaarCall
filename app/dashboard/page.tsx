import { AlertTriangle, CalendarCheck2, PhoneCall, Pill, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DevCallEnginePanel } from "@/components/dashboard/calls/DevCallEnginePanel";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDashboardSummary } from "@/lib/services/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { CallStatus } from "@/lib/types";

const statusTone: Record<CallStatus | "not_generated", "green" | "amber" | "red" | "blue" | "neutral"> = {
  pending: "blue",
  calling: "amber",
  confirmed: "green",
  snoozed: "blue",
  no_answer: "amber",
  missed: "red",
  failed: "red",
  need_help: "red",
  not_generated: "neutral"
};

export default async function DashboardHome() {
  const supabase = await createClient();

  try {
    const summary = await getDashboardSummary(supabase);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Today"
          title="A calm view of family medicine routines"
          description="See what has been confirmed, what needs another attempt, and where your family may need to step in."
        />

        {process.env.NODE_ENV !== "production" ? <DevCallEnginePanel /> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total parents" value={summary.totalParents} helper="Family members under care" icon={UsersRound} accent="mint" />
          <StatCard label="Active schedules" value={summary.activeMedicineSchedules} helper="Medicine routines enabled" icon={Pill} accent="sage" />
          <StatCard label="Today's calls" value={summary.todaysMedicineCalls} helper="Scheduled for today" icon={PhoneCall} accent="blue" />
          <StatCard label="Confirmed" value={summary.confirmed} helper="Updated after response" icon={CalendarCheck2} accent="sage" />
          <StatCard label="Missed" value={summary.missed} helper="Needs retry or check-in" icon={AlertTriangle} accent="peach" />
        </section>

        <section>
          <Card>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-care-ink">Today&apos;s Schedule</h2>
                <p className="text-sm text-sage-700">Medicine calls generated from active schedules.</p>
              </div>
              <StatusBadge label={`${summary.needHelp} need help`} tone={summary.needHelp > 0 ? "red" : "green"} />
            </div>
            <div className="mt-5 divide-y divide-sage-100">
              {summary.todaysSchedule.length === 0 ? (
                <p className="py-4 text-sm leading-6 text-sage-700">No medicine calls scheduled for today.</p>
              ) : (
                summary.todaysSchedule.map((item) => (
                  <div key={item.id} className="grid gap-3 py-4 sm:grid-cols-[90px_1fr_auto] sm:items-center">
                    <p className="text-lg font-bold text-care-ink">{item.time}</p>
                    <div>
                      <p className="font-semibold text-care-ink">{item.parentName}</p>
                      <p className="text-sm text-sage-700">{item.medicineName}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge label={item.language} tone="blue" />
                        <StatusBadge label={item.scriptGenerated ? "script generated" : "script missing"} tone={item.scriptGenerated ? "green" : "amber"} />
                      </div>
                    </div>
                    <StatusBadge label={item.status} tone={statusTone[item.status]} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load dashboard data.";

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Today"
          title="A calm view of family medicine routines"
          description="See what has been confirmed, what needs another attempt, and where your family may need to step in."
        />
        <Card>
          <p className="text-base font-semibold text-care-ink">Dashboard unavailable</p>
          <p className="mt-2 text-sm leading-6 text-sage-700">{message}</p>
        </Card>
      </div>
    );
  }
}
