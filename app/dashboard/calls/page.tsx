import { PhoneCall } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CallSimulationActions } from "@/components/dashboard/calls/CallSimulationActions";
import { DevCallEnginePanel } from "@/components/dashboard/calls/DevCallEnginePanel";
import { GenerateAudioButton } from "@/components/dashboard/calls/GenerateAudioButton";
import { ScriptPreviewButton } from "@/components/dashboard/calls/ScriptPreviewButton";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listCallLogs } from "@/lib/services/calls-alerts";
import { createClient } from "@/lib/supabase/server";
import type { CallStatus } from "@/lib/types";

const statusTone: Record<CallStatus, "green" | "amber" | "red" | "blue" | "neutral"> = {
  pending: "blue",
  calling: "amber",
  confirmed: "green",
  missed: "red",
  no_answer: "amber",
  snoozed: "blue",
  need_help: "red",
  failed: "red"
};

export default async function CallsPage() {
  const supabase = await createClient();

  try {
    const callLogs = await listCallLogs(supabase);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Call history"
          title="Medicine call logs"
          description="Call outcomes will appear here after the call engine writes logs."
        />

        {process.env.NODE_ENV !== "production" ? <DevCallEnginePanel /> : null}

        <section className="grid gap-4">
          {callLogs.length === 0 ? (
            <Card>
              <p className="text-base font-semibold text-care-ink">No call logs yet</p>
              <p className="mt-2 text-sm leading-6 text-sage-700">Once telephony is connected, scheduled call attempts and responses will appear here.</p>
            </Card>
          ) : (
            callLogs.map((call) => (
              <Card key={call.id} className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-care-blue text-sky-800">
                  <PhoneCall className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <h2 className="text-lg font-bold text-care-ink">{call.parentName}</h2>
                    <StatusBadge label={call.status} tone={statusTone[call.status]} />
                  </div>
                  <p className="mt-1 text-sm text-sage-700">
                    {call.medicine} at {call.scheduledTime}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sage-700">{call.response}</p>
                  <div className="mt-4 rounded-lg bg-sage-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={call.scriptText ? "script generated" : "script missing"} tone={call.scriptText ? "green" : "amber"} />
                      <StatusBadge label={call.scriptLanguage} tone="blue" />
                      <StatusBadge label={call.audioStatus} tone={call.audioStatus === "failed" ? "red" : call.audioStatus === "not_generated" ? "neutral" : "green"} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-sage-700">{call.shortPreviewText}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ScriptPreviewButton
                        parentName={call.parentName}
                        medicineName={call.medicine}
                        language={call.scriptLanguage}
                        scriptText={call.scriptText}
                        dtmfInstructions={call.dtmfInstructions}
                        safetyNote={call.safetyNote}
                      />
                      {process.env.NODE_ENV !== "production" ? <GenerateAudioButton callLogId={call.id} /> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage-600">
                      <span>Audio provider: {call.audioProvider ?? "none"}</span>
                      <span>Audio generated: {call.audioGeneratedAt ?? "not yet"}</span>
                    </div>
                    {call.audioUrl ? (
                      <audio className="mt-3 w-full" controls preload="none">
                        <source src={call.audioUrl} />
                      </audio>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage-600">
                    <span>Response: {call.responseType ?? "none"}</span>
                    <span>Created: {call.createdAt}</span>
                  </div>
                  {process.env.NODE_ENV !== "production" ? <CallSimulationActions callLogId={call.id} /> : null}
                </div>
                <div className="rounded-lg bg-sage-50 px-4 py-3 text-left md:text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">Retry count</p>
                  <p className="mt-1 text-2xl font-bold text-care-ink">{call.retryCount}</p>
                </div>
              </Card>
            ))
          )}
        </section>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load call logs.";

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Call history"
          title="Medicine call logs"
          description="Call outcomes will appear here after the call engine writes logs."
        />
        <Card>
          <p className="text-base font-semibold text-care-ink">Call logs unavailable</p>
          <p className="mt-2 text-sm leading-6 text-sage-700">{message}</p>
        </Card>
      </div>
    );
  }
}
