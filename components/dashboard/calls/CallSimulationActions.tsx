"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Check, CircleHelp, Clock3, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SimulatedCallResponse } from "@/lib/types";

const actions: Array<{ response: SimulatedCallResponse; label: string; icon: typeof Check }> = [
  { response: "confirmed", label: "Simulate Confirmed", icon: Check },
  { response: "snoozed", label: "Simulate Snoozed", icon: Clock3 },
  { response: "no_answer", label: "Simulate No Answer", icon: PhoneOff },
  { response: "missed", label: "Simulate Missed", icon: AlertTriangle },
  { response: "need_help", label: "Simulate Need Help", icon: CircleHelp }
];

export function CallSimulationActions({ callLogId }: { callLogId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<SimulatedCallResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simulate(simulatedResponse: SimulatedCallResponse) {
    setLoading(simulatedResponse);
    setError(null);

    const response = await fetch("/api/calls/process-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callLogId, simulatedResponse })
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setLoading(null);
      setError(payload.error ?? "Simulation failed.");
      return;
    }

    setLoading(null);
    router.refresh();
  }

  return (
    <div className="mt-4 border-t border-sage-100 pt-4">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.response}
              type="button"
              variant="secondary"
              className="min-h-10 px-3 py-2 text-xs"
              icon={<Icon className="h-4 w-4" aria-hidden="true" />}
              disabled={loading !== null}
              onClick={() => simulate(action.response)}
            >
              {loading === action.response ? "Simulating" : action.label}
            </Button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
