export function callDescription(status: string | null, notes: string | null) {
  if (status === "failed" && /verified|trial account/i.test(notes ?? "")) {
    return "This number is not verified for calling. The current free tier can call only verified numbers. Contact your account administrator to arrange verification.";
  }
  if (status === "failed" && /paused|changed|deleted|expired|inactive|cancelled/i.test(notes ?? "")) {
    return "This reminder was stopped because its schedule or parent changed, or its calling window expired.";
  }
  const descriptions: Record<string, string> = {
    pending: "Queued for the scheduled time. Calls usually start within one minute of that time.",
    calling: "Call requested. Waiting for the conversation to finish.",
    confirmed: "The parent confirmed the reminder during the call.",
    snoozed: "The parent asked to be reminded later. See upcoming calls for any retry.",
    no_answer: "The call was not answered.",
    missed: "The reminder was not confirmed. Please check in with your parent.",
    need_help: "The parent asked for help. Please contact them.",
    failed: "The call could not be completed. Check number verification or contact your account administrator."
  };
  return descriptions[status ?? "pending"] ?? "No response recorded yet.";
}
