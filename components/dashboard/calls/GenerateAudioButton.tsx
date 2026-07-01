"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GenerateAudioButton({ callLogId }: { callLogId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateAudio() {
    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/calls/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callLogId })
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok || payload.error) {
      setIsSaving(false);
      setError(payload.error ?? "Audio generation failed.");
      return;
    }

    setIsSaving(false);
    router.refresh();
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="min-h-10 px-3 py-2 text-xs"
        icon={<Volume2 className="h-4 w-4" aria-hidden="true" />}
        disabled={isSaving}
        onClick={generateAudio}
      >
        {isSaving ? "Generating" : "Generate Mock Audio"}
      </Button>
      {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
