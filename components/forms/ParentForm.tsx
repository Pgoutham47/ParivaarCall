"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import type { Parent, ParentInput } from "@/lib/types";

function makeInitialForm(parent?: Parent) {
  return {
    name: parent?.name ?? "",
    relationship: parent?.relationship ?? "Mother",
    phoneNumber: parent?.phoneNumber ?? "",
    age: parent?.age ? String(parent.age) : "",
    preferredLanguage: parent?.preferredLanguage ?? "Hindi",
    city: parent?.city ?? "",
    emergencyContactName: parent?.emergencyContactName ?? "",
    emergencyContactPhone: parent?.emergencyContactPhone ?? ""
  };
}

type ParentFormState = ReturnType<typeof makeInitialForm>;

export function ParentForm({
  parent,
  onSave,
  onCancel,
  isSaving = false
}: {
  parent?: Parent;
  onSave: (parent: ParentInput) => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState<ParentFormState>(() => makeInitialForm(parent));

  function updateField(field: keyof ParentFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      return;
    }

    onSave({
      name: form.name,
      relationship: form.relationship,
      phoneNumber: form.phoneNumber,
      age: form.age ? Number(form.age) : null,
      preferredLanguage: form.preferredLanguage,
      city: form.city || null,
      emergencyContactName: form.emergencyContactName || null,
      emergencyContactPhone: form.emergencyContactPhone || null,
      status: parent?.status ?? "active"
    });

    setForm(makeInitialForm());
  }

  return (
    <form className="grid gap-4 md:grid-cols-2">
      <Field label="Parent name">
        <TextInput value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Lakshmi Rao" />
      </Field>
      <Field label="Relationship">
        <SelectInput value={form.relationship} onChange={(event) => updateField("relationship", event.target.value)}>
          <option>Mother</option>
          <option>Father</option>
          <option>Grandmother</option>
          <option>Grandfather</option>
          <option>Aunt</option>
          <option>Uncle</option>
        </SelectInput>
      </Field>
      <Field label="Phone number">
        <TextInput value={form.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} placeholder="+91 98765 43210" />
      </Field>
      <Field label="Age">
        <TextInput type="number" value={form.age} onChange={(event) => updateField("age", event.target.value)} placeholder="72" />
      </Field>
      <Field label="Preferred language">
        <SelectInput value={form.preferredLanguage} onChange={(event) => updateField("preferredLanguage", event.target.value)}>
          <option>Hindi</option>
          <option>Telugu</option>
          <option>Tamil</option>
          <option>Kannada</option>
          <option>Malayalam</option>
          <option>Marathi</option>
          <option>Bengali</option>
          <option>English</option>
        </SelectInput>
      </Field>
      <Field label="City">
        <TextInput value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Hyderabad" />
      </Field>
      <Field label="Emergency contact name">
        <TextInput value={form.emergencyContactName} onChange={(event) => updateField("emergencyContactName", event.target.value)} placeholder="Ramesh Rao" />
      </Field>
      <Field label="Emergency contact phone">
        <TextInput value={form.emergencyContactPhone} onChange={(event) => updateField("emergencyContactPhone", event.target.value)} placeholder="+91 99887 76655" />
      </Field>
      <div className="flex gap-3 md:col-span-2">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : parent ? "Update Parent" : "Save Parent"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
