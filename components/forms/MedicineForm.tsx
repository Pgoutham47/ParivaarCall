"use client";

import { useId, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { localDateKey } from "@/lib/services/timezone";
import { validateMedicine } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import type {
  MedicineSchedule,
  MedicineScheduleInput,
  Parent,
} from "@/lib/types";

function makeInitialForm(
  parents: Parent[],
  schedule?: MedicineSchedule,
  parentId?: string,
) {
  return {
    parentId: schedule?.parentId ?? parentId ?? parents[0]?.id ?? "",
    medicineName: schedule?.medicineName ?? "",
    dosageInstruction: schedule?.dosageInstruction ?? "",
    time: schedule?.time ?? "08:00",
    mealTiming: schedule?.mealTiming ?? "after_food",
    frequency: schedule?.frequency ?? "daily",
    importanceLevel: schedule?.importanceLevel ?? "routine",
    startDate: schedule?.startDate ?? localDateKey(),
    endDate: schedule?.endDate ?? "",
  };
}

type MedicineFormState = ReturnType<typeof makeInitialForm>;

export function MedicineForm({
  parents,
  schedule,
  initialParentId,
  onSave,
  onCancel,
  isSaving = false,
}: {
  parents: Parent[];
  schedule?: MedicineSchedule;
  initialParentId?: string;
  onSave: (schedule: MedicineScheduleInput) => void | Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState<MedicineFormState>(() =>
    makeInitialForm(parents, schedule, initialParentId),
  );
  const [error, setError] = useState<string | null>(null);
  const timingHint = useId();
  const dosageHint = useId();

  function updateField(field: keyof MedicineFormState, value: string) {
    setError(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    try {
      if (!parents.some((parent) => parent.id === form.parentId))
        throw new Error("Choose a family member for this reminder.");
      const input: MedicineScheduleInput = {
        parentId: form.parentId,
        medicineName: form.medicineName.trim(),
        dosageInstruction: form.dosageInstruction.trim() || null,
        time: form.time,
        mealTiming: form.mealTiming as MedicineSchedule["mealTiming"],
        frequency: form.frequency as MedicineSchedule["frequency"],
        importanceLevel:
          form.importanceLevel as MedicineSchedule["importanceLevel"],
        startDate: form.startDate,
        endDate: form.endDate || null,
        isActive: schedule?.isActive ?? true,
      };
      validateMedicine(input);
      setError(null);
      void onSave(input);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Please check the reminder details.",
      );
    }
  }

  const weeklyDay = form.startDate
    ? new Date(`${form.startDate}T12:00:00`).toLocaleDateString("en-IN", {
        weekday: "long",
      })
    : "the start date’s weekday";

  return (
    <form className="space-y-6" onSubmit={handleSave} aria-busy={isSaving}>
      <fieldset disabled={isSaving} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Family member">
            <SelectInput
              required
              value={form.parentId}
              onChange={(event) => updateField("parentId", event.target.value)}
              disabled={parents.length === 0}
            >
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                  {parent.status !== "active" ? " (paused)" : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Medicine name">
            <TextInput
              autoFocus
              required
              maxLength={150}
              value={form.medicineName}
              onChange={(event) =>
                updateField("medicineName", event.target.value)
              }
              placeholder="Name from the prescription"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Dosage instructions (optional)">
              <TextInput
                maxLength={500}
                value={form.dosageInstruction}
                aria-describedby={dosageHint}
                onChange={(event) =>
                  updateField("dosageInstruction", event.target.value)
                }
                placeholder="e.g. 1 tablet with water"
              />
            </Field>
            <p id={dosageHint} className="mt-2 text-xs text-sage-600">
              Use the instructions prescribed by their doctor.
            </p>
          </div>
        </div>

        <div className="border-t border-sage-100 pt-5">
          <h3 className="mb-4 text-sm font-semibold text-care-ink">
            When should we call?
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Call time · India (IST)">
              <TextInput
                required
                type="time"
                value={form.time}
                aria-describedby={timingHint}
                onChange={(event) => updateField("time", event.target.value)}
              />
            </Field>
            <Field label="Food timing">
              <SelectInput
                value={form.mealTiming}
                onChange={(event) =>
                  updateField("mealTiming", event.target.value)
                }
              >
                <option value="before_food">Before food</option>
                <option value="after_food">After food</option>
              </SelectInput>
            </Field>
            <Field label="Repeat">
              <SelectInput
                value={form.frequency}
                onChange={(event) =>
                  updateField("frequency", event.target.value)
                }
              >
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                {form.frequency === "custom" ? (
                  <option value="custom" disabled>
                    Choose a supported schedule
                  </option>
                ) : null}
              </SelectInput>
            </Field>
            <Field label="Start date">
              <TextInput
                required
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
              />
            </Field>
            <Field label="End date (optional)">
              <TextInput
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
            </Field>
          </div>
          <p id={timingHint} className="mt-3 text-xs leading-5 text-sage-600">
            {form.frequency === "weekly"
              ? `Repeats every ${weeklyDay}. `
              : "Repeats daily. "}
            If today’s call time has passed, the next reminder starts on the
            next eligible day. Leave the end date empty to keep the routine
            going.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sage-100 bg-sage-50/60 p-4">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-sage-300 text-sage-700 focus:ring-sage-600"
            checked={form.importanceLevel === "important"}
            onChange={(event) =>
              updateField(
                "importanceLevel",
                event.target.checked ? "important" : "routine",
              )
            }
          />
          <span>
            <span className="block text-sm font-semibold text-care-ink">
              Mark as important
            </span>
            <span className="mt-1 block text-xs leading-5 text-sage-600">
              Add an Important label to make this medicine easier to spot in
              your reminder list.
            </span>
          </span>
        </label>
      </fieldset>
      {error ? (
        <p role="alert" className="notice-error">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 border-t border-sage-100 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving || parents.length === 0}
          icon={
            isSaving ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : undefined
          }
        >
          {isSaving ? "Saving…" : schedule ? "Save changes" : "Create reminder"}
        </Button>
      </div>
    </form>
  );
}
