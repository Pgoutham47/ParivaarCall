import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  ChevronRight,
  Clock3,
  HeartHandshake,
  PhoneCall,
  Pill,
  Plus,
  UsersRound,
} from "lucide-react";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DevCallEnginePanel } from "@/components/dashboard/calls/DevCallEnginePanel";
import { RefreshPageButton } from "@/components/dashboard/calls/RefreshPageButton";
import { callStatus } from "@/components/dashboard/calls/call-status";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDashboardSummary } from "@/lib/services/dashboard";
import { APP_TIMEZONE } from "@/lib/services/timezone";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardHome() {
  const supabase = await createClient();
  const today = new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const timeZoneLabel =
    APP_TIMEZONE === "Asia/Kolkata" ? "India time · IST" : APP_TIMEZONE;

  try {
    const summary = await getDashboardSummary(supabase);
    const needsSetup =
      summary.totalParents === 0 || summary.activeMedicineSchedules === 0;
    const attention = summary.missed + summary.needHelp;

    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow={today}
          title="Your family, at a glance"
          description="A little reassurance for the day ahead."
          action={
            <LinkButton
              href={
                summary.totalParents === 0
                  ? "/dashboard/parents?add=1"
                  : "/dashboard/medicines?add=1"
              }
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              {summary.totalParents === 0 ? "Add a parent" : "Add a reminder"}
            </LinkButton>
          }
        />
        <AutoRefresh />

        {needsSetup ? (
          <section
            aria-labelledby="setup-title"
            className="overflow-hidden rounded-2xl border border-sage-200 bg-sage-50 p-6 sm:p-7"
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-md">
                <p className="eyebrow">LET’S GET YOU STARTED</p>
                <h2
                  id="setup-title"
                  className="mt-2 text-xl font-semibold tracking-tight text-care-ink"
                >
                  Small steps. A more supported routine.
                </h2>
                <p className="mt-2 text-sm leading-6 text-sage-700">
                  Add your parent and their medicine schedule. We’ll keep their
                  reminder calls and responses together here.
                </p>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2 xl:max-w-lg xl:flex-1">
                {[
                  {
                    label: "Add your parent",
                    text: "Name, number & language",
                    href:
                      summary.totalParents > 0
                        ? "/dashboard/parents"
                        : "/dashboard/parents?add=1",
                    done: summary.totalParents > 0,
                  },
                  {
                    label: "Set a reminder",
                    text: "Medicine, dosage & time",
                    href:
                      summary.totalParents === 0
                        ? "/dashboard/parents?add=1"
                        : "/dashboard/medicines?add=1",
                    done: summary.activeMedicineSchedules > 0,
                  },
                ].map((step, index) => (
                  <li key={step.label}>
                    <Link
                      href={step.href}
                      className="focus-ring flex h-full items-center gap-3 rounded-xl border border-sage-200 bg-white p-4 transition hover:border-sage-400"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-sage-800">
                        {step.done ? (
                          <Check className="h-4 w-4" aria-label="Complete" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-care-ink">
                          {step.label}
                        </span>
                        <span className="mt-1 block text-xs text-sage-600">
                          {step.text}
                        </span>
                      </span>
                      <ChevronRight
                        className="ml-auto h-4 w-4 shrink-0 text-sage-500"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <section
          aria-label="Today's care summary"
          className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4"
        >
          <StatCard
            label="Parents in your care"
            value={summary.totalParents}
            helper={`${summary.activeMedicineSchedules} active medicine ${summary.activeMedicineSchedules === 1 ? "schedule" : "schedules"}`}
            icon={UsersRound}
            accent="sage"
          />
          <StatCard
            label="Calls today"
            value={summary.todaysMedicineCalls}
            helper="Includes retries and test calls"
            icon={PhoneCall}
            accent="blue"
          />
          <StatCard
            label="Confirmed calls"
            value={summary.confirmed}
            helper="Confirmed call outcomes today"
            icon={CalendarCheck2}
            accent="mint"
          />
          <StatCard
            label="Unconfirmed attempts"
            value={summary.missed}
            helper={
              summary.needHelp > 0
                ? `${summary.needHelp} unread help ${summary.needHelp === 1 ? "request" : "requests"}`
                : "Missed, unanswered or unsuccessful"
            }
            icon={Clock3}
            accent="peach"
          />
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="min-w-0 overflow-hidden p-0">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sage-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="section-title">Today’s reminders</h2>
                <p className="mt-1 text-xs text-sage-600">{timeZoneLabel}</p>
              </div>
              <Link
                href="/dashboard/medicines"
                className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-md text-sm font-medium text-sage-800 hover:text-sage-600"
              >
                Manage schedule
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            {summary.todaysSchedule.length === 0 ? (
              <div className="empty-state px-6 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-50 text-sage-600">
                  <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-care-ink">
                  A clear day ahead
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sage-600">
                  {summary.activeMedicineSchedules === 0
                    ? "Add a medicine reminder to see your family’s daily routine here."
                    : "There are no reminders scheduled for today. You can review upcoming routines in Medicines."}
                </p>
                <Link
                  href={
                    summary.totalParents === 0
                      ? "/dashboard/parents?add=1"
                      : "/dashboard/medicines"
                  }
                  className="focus-ring mt-5 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-sage-800"
                >
                  {summary.totalParents === 0
                    ? "Add your first parent"
                    : "View medicine schedules"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-sage-100">
                {summary.todaysSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 px-5 py-5 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:px-6"
                  >
                    <p className="self-start pt-0.5 text-sm font-semibold tabular-nums text-sage-800">
                      {item.time}
                    </p>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-care-ink">
                        {item.parentName}
                      </p>
                      <p className="mt-1 break-words text-sm text-sage-600">
                        {item.medicineName}
                        <span className="mx-2 text-sage-300">·</span>
                        {item.language}
                      </p>
                    </div>
                    <div className="col-start-2 sm:col-auto">
                      <StatusBadge {...callStatus[item.status]} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {summary.todaysSchedule.length > 0 ? (
              <div className="border-t border-sage-100 px-5 py-4 sm:px-6">
                <Link
                  href="/dashboard/calls"
                  className="focus-ring inline-flex min-h-8 items-center gap-2 rounded-md text-sm font-semibold text-sage-800"
                >
                  View call history
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </Card>

          <aside className="space-y-5">
            <Card className={attention > 0 ? "border-amber-200" : ""}>
              <div className="flex items-center gap-2">
                <HeartHandshake
                  className="h-5 w-5 text-sage-600"
                  aria-hidden="true"
                />
                <h2 className="text-base font-semibold text-care-ink">
                  A moment to check in
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-sage-700">
                {attention > 0
                  ? "A missed response or request for help deserves a closer look. Review the details and check in with your parent."
                  : "Call outcomes will help you know when your family may need a little extra support."}
              </p>
              <Link
                href="/dashboard/alerts"
                className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-sage-800"
              >
                {attention > 0 ? "Review alerts" : "View alerts"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Card>
            <div className="px-1">
              <h2 className="eyebrow">YOUR CARE SPACE</h2>
              <div className="mt-3 divide-y divide-sage-100">
                {[
                  {
                    href: "/dashboard/parents",
                    label: "Family members",
                    icon: UsersRound,
                  },
                  {
                    href: "/dashboard/medicines",
                    label: "Medicine schedules",
                    icon: Pill,
                  },
                  {
                    href: "/dashboard/settings",
                    label: "Language & call preferences",
                    icon: PhoneCall,
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="focus-ring flex min-h-12 items-center gap-3 rounded-md text-sm text-sage-700 hover:text-sage-900"
                  >
                    <item.icon
                      className="h-4 w-4 text-sage-500"
                      aria-hidden="true"
                    />
                    {item.label}
                    <ChevronRight
                      className="ml-auto h-4 w-4 text-sage-400"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
        {process.env.NODE_ENV !== "production" ? <DevCallEnginePanel /> : null}
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={today}
          title="Your family, at a glance"
          description="A little reassurance for the day ahead."
        />
        <Card className="space-y-4">
          <h2 className="section-title">We couldn’t load your overview</h2>
          <p className="text-sm leading-6 text-sage-700">
            Please check your connection and try again. Your family’s saved
            schedules are still in place.
          </p>
          <RefreshPageButton />
        </Card>
      </div>
    );
  }
}
