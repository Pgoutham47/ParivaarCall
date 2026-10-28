import type { CallStatus } from "@/lib/types";

export const callStatus: Record<
  CallStatus | "not_generated",
  {
    label: string;
    tone: "green" | "amber" | "red" | "blue" | "neutral";
  }
> = {
  pending: { label: "Scheduled", tone: "blue" },
  calling: { label: "In progress", tone: "blue" },
  confirmed: { label: "Confirmed", tone: "green" },
  snoozed: { label: "Remind later", tone: "amber" },
  no_answer: { label: "No answer", tone: "amber" },
  missed: { label: "Not confirmed", tone: "red" },
  failed: { label: "Call unsuccessful", tone: "red" },
  need_help: { label: "Help requested", tone: "red" },
  not_generated: { label: "Scheduled", tone: "neutral" },
};
