import type { Metadata } from "next";
import {
  CalendarCheck2,
  ChartNoAxesCombined,
  ChevronDown,
  Flame,
  Pill,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RefreshPageButton } from "@/components/dashboard/calls/RefreshPageButton";
import { Card } from "@/components/ui/Card";
import {
  getAdherenceSummary,
  type AdherenceBreakdownRow,
} from "@/lib/services/analytics";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Care insights" };

function formatRate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function Breakdown({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: AdherenceBreakdownRow[];
}) {
  return (
    <Card>
      <h2 className="section-title">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-sage-600">{description}</p>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl bg-sage-50 px-4 py-6 text-sm text-sage-600">
          This view will fill in after reminder calls are completed.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-sage-100">
          {rows.map((row) => (
            <div key={row.name} className="py-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="min-w-0 break-words text-sm font-medium text-care-ink">
                  {row.name}
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-care-ink">
                  {row.rate}%
                </p>
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-sage-100"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-sage-600"
                  style={{ width: `${Math.min(100, Math.max(0, row.rate))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-sage-500">
                {row.confirmed} of {row.total} doses confirmed
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  try {
    const summary = await getAdherenceSummary(supabase);
    const maxDailyTotal = Math.max(1, ...summary.daily.map((day) => day.total));
    const hasDailyData = summary.daily.some((day) => day.total > 0);
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="THE BIGGER PICTURE"
          title="Care insights"
          description="See how medicine routines are going, one day at a time."
          action={
            <span className="inline-flex items-center gap-2 rounded-lg border border-sage-200 bg-white px-3 py-2.5 text-sm text-sage-700">
              <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
              Last {summary.windowDays} days
            </span>
          }
        />
        <section
          aria-label="Medicine confirmation summary"
          className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4"
        >
          <StatCard
            label="30-day confirmation rate"
            value={formatRate(summary.adherence30)}
            helper={`${summary.confirmedDoses} of ${summary.totalDoses} doses confirmed`}
            icon={TrendingUp}
            accent="sage"
          />
          <StatCard
            label="7-day confirmation rate"
            value={formatRate(summary.adherence7)}
            helper="Reported in the past week"
            icon={CalendarCheck2}
            accent="mint"
          />
          <StatCard
            label="Confirmation streak"
            value={`${summary.streakDays} ${summary.streakDays === 1 ? "day" : "days"}`}
            helper="Tracked days with all doses confirmed"
            icon={Flame}
            accent="peach"
          />
          <StatCard
            label="Doses tracked"
            value={summary.totalDoses}
            helper="Doses with a completed outcome"
            icon={Pill}
            accent="blue"
          />
        </section>
        <Card className="min-w-0">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="section-title">Daily confirmations</h2>
              <p className="mt-1 text-sm text-sage-600">
                A view of the last 14 days.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-sage-600">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-sage-600"
                  aria-hidden="true"
                />
                Confirmed
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-sage-200"
                  aria-hidden="true"
                />
                Not confirmed
              </span>
            </div>
          </div>
          {hasDailyData ? (
            <>
              <div
                className="focus-ring mt-6 overflow-x-auto rounded-lg pb-2"
                role="region"
                aria-label="Daily confirmation chart. Scroll horizontally to view all 14 days."
                tabIndex={0}
              >
                <div className="grid min-w-[600px] grid-cols-[repeat(14,minmax(0,1fr))] gap-3">
                  {summary.daily.map((day) => (
                    <div
                      key={day.dateKey}
                      role="img"
                      aria-label={`${day.label}: ${day.confirmed} of ${day.total} doses confirmed`}
                    >
                      <div className="relative flex h-48 flex-col items-center justify-end border-b border-sage-200 pt-6">
                        <span className="mb-2 text-[11px] font-medium tabular-nums text-sage-600">
                          {day.total > 0
                            ? `${day.confirmed}/${day.total}`
                            : "—"}
                        </span>
                        {day.total === 0 ? (
                          <span className="h-1 w-5 rounded-t bg-sage-100" />
                        ) : (
                          <div
                            className="flex w-full max-w-7 flex-col justify-end overflow-hidden rounded-t-md bg-sage-200"
                            style={{
                              height: `${(day.total / maxDailyTotal) * 100}%`,
                            }}
                          >
                            <div
                              className="w-full bg-sage-600"
                              style={{
                                height: `${(day.confirmed / day.total) * 100}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-center text-[10px] text-sage-600">
                        {day.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <details className="group mt-4 border-t border-sage-100 pt-3">
                <summary className="focus-ring flex min-h-10 w-fit cursor-pointer list-none items-center gap-2 rounded-md text-xs font-medium text-sage-700 [&::-webkit-details-marker]:hidden">
                  View daily figures
                  <ChevronDown
                    className="h-3.5 w-3.5 transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      Daily dose confirmation data for the past 14 days
                    </caption>
                    <thead>
                      <tr className="border-b border-sage-100 text-xs text-sage-600">
                        <th scope="col" className="py-3 pr-4 font-medium">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Confirmed
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Tracked
                        </th>
                        <th
                          scope="col"
                          className="py-3 pl-3 text-right font-medium"
                        >
                          Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.daily.map((day) => (
                        <tr
                          key={day.dateKey}
                          className="border-b border-sage-50 text-sage-800"
                        >
                          <th scope="row" className="py-3 pr-4 font-normal">
                            {day.label}
                          </th>
                          <td className="px-3 py-3 tabular-nums">
                            {day.confirmed}
                          </td>
                          <td className="px-3 py-3 tabular-nums">
                            {day.total}
                          </td>
                          <td className="py-3 pl-3 text-right tabular-nums">
                            {formatRate(day.rate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          ) : (
            <div className="py-14 text-center">
              <ChartNoAxesCombined
                className="mx-auto h-8 w-8 text-sage-400"
                aria-hidden="true"
              />
              <h3 className="mt-4 text-base font-semibold text-care-ink">
                Your routine will take shape here
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-sage-600">
                As medicine reminder calls are completed, you’ll see daily
                confirmations and patterns to follow up on.
              </p>
            </div>
          )}
        </Card>
        <section className="grid gap-6 xl:grid-cols-2">
          <Breakdown
            title="By medicine"
            description="Across your family, with lower confirmation rates first."
            rows={summary.byMedicine}
          />
          <Breakdown
            title="By parent"
            description="Confirmed doses from each parent’s completed reminders."
            rows={summary.byParent}
          />
        </section>
        <p className="max-w-3xl text-xs leading-6 text-sage-500">
          Insights reflect responses to completed reminder calls, not
          independent proof of medicine intake. Retries count as one dose;
          one-time test calls are excluded. Streaks skip days without completed
          outcomes.
        </p>
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="THE BIGGER PICTURE"
          title="Care insights"
          description="See how medicine routines are going, one day at a time."
        />
        <Card className="space-y-4">
          <h2 className="section-title">We couldn’t load your insights</h2>
          <p className="text-sm leading-6 text-sage-700">
            Please check your connection and try again. Your call history is
            still saved.
          </p>
          <RefreshPageButton />
        </Card>
      </div>
    );
  }
}
