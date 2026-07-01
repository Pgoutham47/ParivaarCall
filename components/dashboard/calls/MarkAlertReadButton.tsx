"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MarkAlertReadButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markRead() {
    setIsSaving(true);
    setError(null);

    const response = await fetch(`/api/alerts/${alertId}/read`, { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setIsSaving(false);
      setError(payload.error ?? "Could not mark alert read.");
      return;
    }

    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-5">
      <Button
        type="button"
        variant="secondary"
        className="min-h-10 px-3 py-2 text-xs"
        icon={<Check className="h-4 w-4" aria-hidden="true" />}
        disabled={isSaving}
        onClick={markRead}
      >
        {isSaving ? "Marking read" : "Mark as read"}
      </Button>
      {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
