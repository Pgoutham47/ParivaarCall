"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MarkAlertReadButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markRead() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Could not mark this alert as read.");
      setIsRead(true);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      {isRead ? (
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-xs text-sage-600"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Marked as read
        </span>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
          disabled={isSaving}
          onClick={markRead}
        >
          {isSaving ? "Saving…" : "Mark as read"}
        </Button>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
