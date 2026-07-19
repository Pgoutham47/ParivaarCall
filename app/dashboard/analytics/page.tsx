import { CalendarCheck2, Flame, Pill, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { getAdherenceSummary, type AdherenceBreakdownRow } from "@/lib/services/analytics";
import { createClient } from "@/lib/supabase/server";

function formatRate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

// Single-series adherence bar: ink text labels, one hue, track shows scale.
function AdherenceBar({ rate }: { rate: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-sage-100" role="presentation">
      <div className="h-full rounded-full bg-sage-600" style={{ width: `${Math.max(rate, 2)}%` }} />
    </div>
  );
}

function BreakdownTable({ title, description, rows, showParent }: { title: string; description: string; rows: AdherenceBreakdownRow[]; showParent?: boolean }) {
  return (
    <Card>
      <h2 className="text-xl font-bold text-care-ink">{title}</h2>
      <p className="mt-1 text-sm text-sage-700">{description}</p>
      {rows.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-sage-700">No completed calls in this period yet.</p>
      ) : (
        <div className="mt-5 divide-y divide-sage-100">
          {rows.map((row) => (
            <div key={`${row.name}-${row.parentName ?? ""}`} className="grid items-center gap-3 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="truncate font-semibold text-care-ink">{row.name}</p>
                {showParent && row.parentName ? <p className="truncate text-sm text-sage-700">{row.parentName}</p> : null}
              </div>
              <AdherenceBar rate={row.rate} />
              <p className="text-sm font-semibold text-care-ink sm:text-right">
                {row.rate}%
                <span className="ml-2 font-normal text-sage-600">
                  {row.confirmed}/{row.total} confirmed
                </span>
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

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Insights"
          title="Adherence analytics"
          description="How reliably medicines are being confirmed, per day, per medicine, and per parent."
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="30-day adherence" value={formatRate(summary.adherence30)} helper={`${summary.confirmedDoses} of ${summary.totalDoses} doses confirmed`} icon={TrendingUp} accent="sage" />
          <StatCard label="7-day adherence" value={formatRate(summary.adherence7)} helper="Confirmed share this week" icon={CalendarCheck2} accent="mint" />
          <StatCard label="Current streak" value={`${summary.streakDays} ${summary.streakDays === 1 ? "day" : "days"}`} helper="Days with every dose confirmed" icon={Flame} accent="peach" />
          <StatCard label="Doses tracked" value={summary.totalDoses} helper={`Completed calls, last ${summary.windowDays} days`} icon={Pill} accent="blue" />
        </section>

        <Card>
          <h2 className="text-xl font-bold text-care-ink">Daily confirmations — last 14 days</h2>
          <p className="mt-1 text-sm text-sage-700">Bar height shows doses with a completed call; the filled part is confirmed doses.</p>
          <div className="mt-6 grid grid-cols-7 items-end gap-2 sm:grid-cols-[repeat(14,minmax(0,1fr))]" style={{ height: "9rem" }}>
            {summary.daily.map((day) => {
              const totalHeight = day.total === 0 ? 0 : Math.max((day.total / maxDailyTotal) * 100, 12);
              const confirmedShare = day.total === 0 ? 0 : (day.confirmed / day.total) * 100;

              return (
                <div
                  key={day.dateKey}
                  className="flex h-full flex-col items-center justify-end gap-1.5"
                  title={day.total === 0 ? `${day.label}: no completed calls` : `${day.label}: ${day.confirmed}/${day.total} confirmed (${day.rate}%)`}
                >
                  {day.total === 0 ? (
                    <div className="h-1.5 w-full max-w-[28px] rounded-full bg-sage-100" />
                  ) : (
                    <div className="flex w-full max-w-[28px] flex-col justify-end overflow-hidden rounded-t bg-sage-200" style={{ height: `${totalHeight}%` }}>
                      <div className="w-full bg-sage-600" style={{ height: `${confirmedShare}%` }} />
                    </div>
                  )}
                  <p className="text-[10px] font-medium leading-none text-sage-600">{day.label.split(" ")[0]}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-sage-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sage-600" aria-hidden="true" /> Confirmed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sage-200" aria-hidden="true" /> Not confirmed
            </span>
          </div>
        </Card>

        <section className="grid gap-4 xl:grid-cols-2">
          <BreakdownTable
            title="By medicine"
            description="Lowest adherence first, so problem medicines surface at the top."
            rows={summary.byMedicine}
            showParent
          />
          <BreakdownTable title="By parent" description="Confirmed share of completed calls per parent." rows={summary.byParent} />
        </section>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load analytics.";

    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Insights" title="Adherence analytics" description="How reliably medicines are being confirmed." />
        <Card>
          <p className="text-base font-semibold text-care-ink">Analytics unavailable</p>
          <p className="mt-2 text-sm leading-6 text-sage-700">{message}</p>
        </Card>
      </div>
    );
  }
}
