import type { Metadata } from "next";
import { ArrowRight, PhoneCall } from "lucide-react";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CallHistoryList } from "@/components/dashboard/calls/CallHistoryList";
import { DevCallEnginePanel } from "@/components/dashboard/calls/DevCallEnginePanel";
import { HistoryPagination } from "@/components/dashboard/calls/HistoryPagination";
import { RefreshPageButton } from "@/components/dashboard/calls/RefreshPageButton";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listCallLogs } from "@/lib/services/calls-alerts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Call history" };

export default async function CallsPage({
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
    const rows = await listCallLogs(supabase, page);
    const calls = rows.slice(0, 25);
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="STAY IN THE LOOP"
          title="Call history"
          description="Every reminder and response, in one place. Open a call to see the conversation."
        />
        <AutoRefresh />
        {calls.length > 0 ? (
          <CallHistoryList calls={calls} />
        ) : (
          <Card className="px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 text-sage-600">
              <PhoneCall className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-care-ink">
              {page > 1
                ? "You’ve reached the end"
                : "Your first conversation starts here"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-sage-600">
              {page > 1
                ? "There are no older calls on this page. Return to the latest results to catch up."
                : "Once a reminder call is scheduled, its progress and outcome will appear here automatically."}
            </p>
            <LinkButton
              href={page > 1 ? "/dashboard/calls" : "/dashboard/medicines"}
              className="mt-6"
              variant="secondary"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {page > 1 ? "Latest calls" : "Manage reminders"}
            </LinkButton>
          </Card>
        )}
        <HistoryPagination
          page={page}
          hasNext={rows.length > 25}
          count={calls.length}
          path="/dashboard/calls"
        />
        {process.env.NODE_ENV !== "production" ? <DevCallEnginePanel /> : null}
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="STAY IN THE LOOP"
          title="Call history"
          description="Every reminder and response, in one place."
        />
        <Card className="space-y-4">
          <h2 className="section-title">We couldn’t load your calls</h2>
          <p className="text-sm leading-6 text-sage-700">
            Please check your connection and try again. Your saved history will
            be here when you return.
          </p>
          <RefreshPageButton />
        </Card>
      </div>
    );
  }
}
