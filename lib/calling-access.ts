import { normalizePhoneNumber } from "@/lib/phone";
import { isPresentationDemo } from "@/lib/demo-account";

export function freeTierCalling() {
  return process.env.FREE_TIER_CALLING !== "false";
}

// Live verification is scoped to the caregiver account. Knowing another
// family's verified phone number must not grant permission to call it.
export function canCallNumber(phone: string, caregiverId?: string) {
  if (isPresentationDemo(caregiverId)) return false;
  if (!freeTierCalling()) return true;
  try {
    const normalized = normalizePhoneNumber(phone);
    const configuration = process.env.VERIFIED_CALL_NUMBERS ?? "";
    let numbers: unknown;
    if (process.env.CALL_PROVIDER === "simulated" && !configuration.startsWith("{")) {
      numbers = configuration.split(","); // isolated development simulations
    } else {
      const accounts = JSON.parse(configuration);
      numbers = caregiverId ? accounts[caregiverId] : [];
    }
    return Array.isArray(numbers) && numbers.some(value => {
      try { return typeof value === "string" && normalizePhoneNumber(value.trim()) === normalized; } catch { return false; }
    });
  } catch { return false; }
}
