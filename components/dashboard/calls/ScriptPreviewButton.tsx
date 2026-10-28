"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

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
  safetyNote,
}: ScriptPreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="min-h-9 px-2 py-1.5 text-xs"
        icon={<FileText className="h-3.5 w-3.5" aria-hidden="true" />}
        onClick={() => setIsOpen(true)}
      >
        Reminder text
      </Button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Reminder for ${parentName}`}
        description={`${medicineName} · ${language}`}
      >
        <div className="rounded-xl border border-sage-100 bg-sage-50 p-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-care-ink">
            {scriptText ??
              "The reminder text will appear when this call is prepared."}
          </p>
        </div>
        <p className="mt-4 text-xs leading-6 text-sage-600">
          {safetyNote ??
            "This is a reminder, not medical advice. Follow the prescribed dosage."}
        </p>
      </Dialog>
    </>
  );
}
