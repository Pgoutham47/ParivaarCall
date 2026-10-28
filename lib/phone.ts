// Accept familiar Indian mobile numbers while storing the international form
// required by the calling provider. Other countries require an explicit +code.
export function normalizePhoneNumber(value: string): string {
  if (typeof value !== "string") throw new Error("Enter a valid phone number.");
  const compact = value.trim().replace(/[\s().-]/g, "");
  const international = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  const normalized = /^[6-9]\d{9}$/.test(international)
    ? `+91${international}`
    : /^91[6-9]\d{9}$/.test(international)
      ? `+${international}`
      : international;

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Enter a valid phone number with country code (for example, +91 98765 43210). Indian mobile numbers can also use 10 digits.");
  }

  return normalized;
}
