"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { Parent } from "@/lib/types";

export function TestCallButton({
  parent,
  disabled = false,
  presentationDemo = false,
}: {
  parent: Parent;
  disabled?: boolean;
  presentationDemo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const available =
    !presentationDemo &&
    Boolean(parent.callingVerified) &&
    parent.status === "active";

  async function call() {
    if (busy || disabled || !available) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/calls/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: parent.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(
          result.error ??
            result.message ??
            "Could not request the call. Please try again.",
        );
        return;
      }
      setOpen(false);
      router.push("/dashboard/calls");
      router.refresh();
    } catch {
      setMessage(
        "We couldn’t confirm the request. Check Call history before trying again to avoid placing a second call.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={busy || disabled || !available}
        title={
          presentationDemo
            ? "Live and test calls are disabled for this account"
            : !available
              ? parent.status !== "active"
                ? "Resume this family member’s calls first"
                : "Verify this number before making a test call"
              : undefined
        }
        icon={<Phone className="h-3.5 w-3.5" aria-hidden="true" />}
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
      >
        {presentationDemo ? "Calls disabled" : "Test a call"}
      </Button>
      <Dialog
        open={open && !presentationDemo}
        dismissible={!busy}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={`Call ${parent.name} now?`}
        description="This places one real test call. Please make sure they are expecting it."
      >
        <div className="mb-5 rounded-xl border border-sage-100 bg-sage-50/60 p-4">
          <p className="text-sm font-semibold text-care-ink">{parent.name}</p>
          <p className="mt-1 text-lg tabular-nums text-care-ink">
            {parent.phoneNumber}
          </p>
          <p className="mt-3 text-sm leading-6 text-sage-600">
            The call clearly says no medicine is needed. It uses your saved
            language preference, or {parent.preferredLanguage} when set to the
            parent’s language. Test calls do not retry.
          </p>
        </div>
        {message ? (
          <div role="alert" className="notice-error mb-4">
            {message}
            <button
              type="button"
              className="focus-ring mt-2 block rounded font-semibold underline underline-offset-4"
              onClick={() => {
                router.push("/dashboard/calls");
                setOpen(false);
              }}
            >
              View call history
            </button>
          </div>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || disabled || !available}
            onClick={call}
            icon={
              busy ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Phone className="h-4 w-4" aria-hidden="true" />
              )
            }
          >
            {busy ? "Requesting call…" : "Place test call"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
