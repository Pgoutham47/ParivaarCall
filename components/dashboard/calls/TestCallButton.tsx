"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Parent } from "@/lib/types";

export function TestCallButton({ parent }: { parent: Parent }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function call() {
    if (!window.confirm(`Place one ${parent.preferredLanguage} test call to ${parent.phoneNumber}? The call will say that no medicine is needed.`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/calls/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId: parent.id }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error ?? result.message ?? "Could not request the call."); return; }
      router.push("/dashboard/calls"); router.refresh();
    } catch { setMessage("Could not confirm the request. Check Calls before trying again."); }
    finally { setBusy(false); }
  }
  return <div><Button type="button" variant="secondary" disabled={busy || !parent.callingVerified || parent.status !== "active"} onClick={call}>{busy ? "Requesting call..." : "Make test call"}</Button>{message ? <p role="alert" className="mt-2 text-sm text-rose-700">{message}</p> : null}</div>;
}
