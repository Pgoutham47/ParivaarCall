"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ScriptPreviewButtonProps = {
  parentName: string;
  medicineName: string;
  language: string;
  scriptText: string | null;
  safetyNote: string | null;
};

export function ScriptPreviewButton({
  parentName,
  medicineName,
  language,
  scriptText,
  safetyNote
}: ScriptPreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="min-h-10 px-3 py-2 text-xs"
        icon={<FileText className="h-4 w-4" aria-hidden="true" />}
        onClick={() => setIsOpen(true)}
      >
        Preview Script
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-care-ink/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg border border-sage-100 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-600">{language}</p>
                <h2 className="mt-1 text-xl font-bold text-care-ink">{parentName}</h2>
                <p className="mt-1 text-sm text-sage-700">{medicineName}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="min-h-10 px-3 py-2"
                icon={<X className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="mt-5 rounded-lg bg-sage-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-care-ink">{scriptText ?? "Script not generated yet."}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage-600">Safety note</p>
              <p className="mt-2 text-sm leading-6 text-sage-700">{safetyNote ?? "Reminder only. No medical advice is generated."}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
