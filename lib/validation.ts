import type { MedicineScheduleInput, ParentInput, VoiceSettingsInput } from "@/lib/types";
import { normalizePhoneNumber } from "@/lib/phone";

export function validateParent(input: ParentInput) {
  if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 100) throw new Error("Enter a parent name of 1–100 characters.");
  normalizePhoneNumber(input.phoneNumber);
  if (input.age !== null && (!Number.isInteger(input.age) || input.age < 1 || input.age > 120)) throw new Error("Age must be between 1 and 120.");
  if (!["Mother", "Father", "Grandmother", "Grandfather", "Aunt", "Uncle"].includes(input.relationship)) throw new Error("Choose a relationship.");
  if (!["Telugu", "English"].includes(input.preferredLanguage)) throw new Error("Choose Telugu or English.");
  if (input.status && !["active", "inactive"].includes(input.status)) throw new Error("Choose an active or inactive status.");
}
function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
export function validateMedicine(input: MedicineScheduleInput) {
  if (!input.parentId || typeof input.medicineName !== "string" || !input.medicineName.trim() || input.medicineName.length > 150) throw new Error("Choose a parent and enter a medicine name of 1–150 characters.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) throw new Error("Enter a valid reminder time.");
  if (!input.startDate || !validDate(input.startDate) || (input.endDate && !validDate(input.endDate))) throw new Error("Enter valid start and end dates.");
  if (input.endDate && input.endDate < input.startDate) throw new Error("End date must be on or after the start date.");
  if (!["daily", "weekly"].includes(input.frequency)) throw new Error("Choose daily or weekly. Weekly calls use the weekday of the start date.");
  if (!["before_food", "after_food"].includes(input.mealTiming)) throw new Error("Choose before or after food.");
  if (input.dosageInstruction && input.dosageInstruction.length > 500) throw new Error("Keep dosage instructions within 500 characters.");
}
export function validateSettings(input: VoiceSettingsInput) {
  if (!Number.isInteger(input.retryAttempts) || input.retryAttempts < 0 || input.retryAttempts > 5) throw new Error("Retry attempts must be between 0 and 5.");
  if (!Number.isInteger(input.retryGapMinutes) || input.retryGapMinutes < 5 || input.retryGapMinutes > 120) throw new Error("Retry gap must be between 5 and 120 minutes.");
  if (!["Telugu", "English", "Parent preferred language"].includes(input.languagePreference)) throw new Error("Choose a supported call language.");
  if (!["formal", "casual"].includes(input.respectMode)) throw new Error("Choose a respect mode.");
}
