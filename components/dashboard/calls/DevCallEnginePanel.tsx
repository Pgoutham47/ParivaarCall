"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ActionState = {
  loading: "generate" | "process" | null;
  message: string | null;
};

export function DevCallEnginePanel() {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({
    loading: null,
    message: null,
  });

  async function runAction(action: "generate" | "process") {
    setState({ loading: action, message: null });

    try {
      const response = await fetch(`/api/calls/${action}`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (!response.ok) {
        setState({
          loading: null,
          message: String(payload.error ?? "Call engine action failed."),
        });
        return;
      }

      const created = Number(payload.created ?? 0);
      const skippedDuplicates = Number(payload.skippedDuplicates ?? 0);
      const activeSchedulesFound = Number(payload.activeSchedulesFound ?? 0);
      const eligibleSchedules = Number(payload.eligibleSchedules ?? 0);
      const errors = Array.isArray(payload.errors)
        ? payload.errors.filter((item) => typeof item === "string")
        : [];
      const message =
        action === "generate"
          ? errors.length > 0
            ? `Call log generation had errors: ${errors[0]}`
            : created === 0 && skippedDuplicates === 0
              ? `No call logs created. Found ${activeSchedulesFound} active schedule${activeSchedulesFound === 1 ? "" : "s"}, ${eligibleSchedules} eligible for today.`
              : `Created ${created}, skipped ${skippedDuplicates} duplicate${skippedDuplicates === 1 ? "" : "s"}.`
          : `Processed ${payload.processed ?? 0}: ${payload.calling ?? 0} dialing, ${payload.confirmed ?? 0} confirmed, ${payload.snoozed ?? 0} snoozed, ${payload.no_answer ?? 0} no answer.`;

      setState({ loading: null, message });
      router.refresh();
    } catch (error) {
      setState({
        loading: null,
        message:
          error instanceof Error
            ? error.message
            : "Call engine action failed. Check the browser console or server logs.",
      });
    }
  }

  return (
    <details className="rounded-xl border border-dashed border-sage-200 px-5 py-3">
      <summary className="focus-ring cursor-pointer rounded text-xs font-medium text-sage-500">
        Development tools
      </summary>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-care-ink">
            Reminder processing
          </p>
          <p className="mt-1 text-sm leading-6 text-sage-700">
            These controls use the configured calling service. Processing
            pending calls can place live calls when the live provider is
            enabled.
          </p>
          {state.message ? (
            <p role="status" className="mt-2 text-sm font-medium text-care-ink">
              {state.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            disabled={state.loading !== null}
            onClick={() => runAction("generate")}
          >
            Generate today&apos;s call logs
          </Button>
          <Button
            type="button"
            icon={<Play className="h-4 w-4" aria-hidden="true" />}
            disabled={state.loading !== null}
            onClick={() => runAction("process")}
          >
            Process pending calls
          </Button>
        </div>
      </div>
    </details>
  );
}
