"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import type { MedicineSchedule, MedicineScheduleInput, Parent } from "@/lib/types";

function makeInitialForm(parents: Parent[], schedule?: MedicineSchedule) {
  return {
    parentId: schedule?.parentId ?? parents[0]?.id ?? "",
    medicineName: schedule?.medicineName ?? "",
    dosageInstruction: schedule?.dosageInstruction ?? "",
    time: schedule?.time ?? "08:00",
    mealTiming: schedule?.mealTiming ?? "after_food",
    frequency: schedule?.frequency ?? "daily",
    importanceLevel: schedule?.importanceLevel ?? "routine",
    startDate: schedule?.startDate ?? "",
    endDate: schedule?.endDate ?? ""
  };
}

type MedicineFormState = ReturnType<typeof makeInitialForm>;

export function MedicineForm({
  parents,
  schedule,
  onSave,
  onCancel,
  isSaving = false
}: {
  parents: Parent[];
  schedule?: MedicineSchedule;
  onSave: (schedule: MedicineScheduleInput) => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState<MedicineFormState>(() => makeInitialForm(parents, schedule));

  function updateField(field: keyof MedicineFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSave() {
    const parent = parents.find((item) => item.id === form.parentId);
    if (!parent || !form.medicineName.trim()) {
      return;
    }

    onSave({
      parentId: parent.id,
      medicineName: form.medicineName,
      dosageInstruction: form.dosageInstruction || null,
      time: form.time,
      mealTiming: form.mealTiming as MedicineSchedule["mealTiming"],
      frequency: form.frequency as MedicineSchedule["frequency"],
      importanceLevel: form.importanceLevel as MedicineSchedule["importanceLevel"],
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      endDate: form.endDate || null,
      isActive: schedule?.isActive ?? true
    });

    setForm(makeInitialForm(parents));
  }

  return (
    <form className="grid gap-4 md:grid-cols-2">
      <Field label="Select parent">
        <SelectInput value={form.parentId} onChange={(event) => updateField("parentId", event.target.value)} disabled={parents.length === 0}>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Medicine name">
        <TextInput value={form.medicineName} onChange={(event) => updateField("medicineName", event.target.value)} placeholder="Metformin" />
      </Field>
      <Field label="Dosage instruction">
        <TextInput value={form.dosageInstruction} onChange={(event) => updateField("dosageInstruction", event.target.value)} placeholder="1 tablet with water" />
      </Field>
      <Field label="Time">
        <TextInput type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} />
      </Field>
      <Field label="Before food / after food">
        <SelectInput value={form.mealTiming} onChange={(event) => updateField("mealTiming", event.target.value)}>
          <option value="before_food">Before food</option>
          <option value="after_food">After food</option>
        </SelectInput>
      </Field>
      <Field label="Frequency">
        <SelectInput value={form.frequency} onChange={(event) => updateField("frequency", event.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </SelectInput>
      </Field>
      <Field label="Start date">
        <TextInput type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} />
      </Field>
      <Field label="End date optional">
        <TextInput type="date" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} />
      </Field>
      <label className="flex min-h-12 items-center justify-between rounded-lg border border-sage-200 bg-white px-3 py-2 md:col-span-2">
        <span>
          <span className="block text-sm font-semibold text-care-ink">Important medicine</span>
          <span className="block text-xs text-sage-600">Higher priority alerts when a dose is missed.</span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-sage-300 text-sage-700 focus:ring-sage-600"
          checked={form.importanceLevel === "important"}
          onChange={(event) => updateField("importanceLevel", event.target.checked ? "important" : "routine")}
        />
      </label>
      <div className="flex gap-3 md:col-span-2">
        <Button type="button" onClick={handleSave} disabled={isSaving || parents.length === 0}>
          {isSaving ? "Saving..." : schedule ? "Update Medicine" : "Save Medicine"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
