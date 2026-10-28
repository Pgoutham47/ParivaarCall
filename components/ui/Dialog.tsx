"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  dismissible = true,
  closeOnBackdrop = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
  dismissible?: boolean;
  closeOnBackdrop?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => {
          const closedDetails = element.closest("details:not([open])");
          return (
            element.getClientRects().length > 0 &&
            (!closedDetails || element.closest("summary"))
          );
        });
        const first = controls[0];
        const last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (
          closeOnBackdrop &&
          dismissible &&
          event.target === event.currentTarget
        )
          onClose();
      }}
      className={cn(
        "care-dialog m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl border border-sage-200 bg-white p-0 text-care-ink shadow-soft",
        size === "lg" ? "max-w-2xl" : "max-w-lg",
      )}
    >
      <div>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-sage-100 bg-white px-5 py-5 sm:px-7">
          <div>
            <h2 id={titleId} className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1.5 text-sm leading-6 text-sage-600"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Close dialog"
            className="focus-ring -mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-sage-600 transition hover:bg-sage-50 hover:text-care-ink disabled:cursor-wait disabled:opacity-40"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="p-5 sm:p-7">{open ? children : null}</div>
      </div>
    </dialog>
  );
}
