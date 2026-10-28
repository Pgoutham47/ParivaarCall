"use client";

import { useId, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { normalizePhoneNumber } from "@/lib/phone";
import { validateParent } from "@/lib/validation";
import {
  selectableCallLanguages,
  type Parent,
  type ParentInput,
} from "@/lib/types";

function makeInitialForm(parent?: Parent) {
  return {
    name: parent?.name ?? "",
    relationship: parent?.relationship ?? "Mother",
    phoneNumber: parent?.phoneNumber ?? "",
    age: parent?.age ? String(parent.age) : "",
    preferredLanguage: parent?.preferredLanguage ?? "Telugu",
    city: parent?.city ?? "",
    emergencyContactName: parent?.emergencyContactName ?? "",
    emergencyContactPhone: parent?.emergencyContactPhone ?? "",
  };
}

type ParentFormState = ReturnType<typeof makeInitialForm>;

export function ParentForm({
  parent,
  onSave,
  onCancel,
  isSaving = false,
}: {
  parent?: Parent;
  onSave: (parent: ParentInput) => void | Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState<ParentFormState>(() =>
    makeInitialForm(parent),
  );
  const [error, setError] = useState<string | null>(null);
  const phoneHint = useId();

  function updateField(field: keyof ParentFormState, value: string) {
    setError(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    try {
      const input: ParentInput = {
        name: form.name.trim(),
        relationship: form.relationship,
        phoneNumber: normalizePhoneNumber(form.phoneNumber),
        age: form.age ? Number(form.age) : null,
        preferredLanguage: form.preferredLanguage,
        city: form.city.trim() || null,
        emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactPhone: form.emergencyContactPhone.trim()
          ? normalizePhoneNumber(form.emergencyContactPhone)
          : null,
        status: parent?.status === "active" || !parent ? "active" : "inactive",
      };
      validateParent(input);
      setError(null);
      void onSave(input);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Please check the details below.",
      );
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSave} aria-busy={isSaving}>
      <fieldset disabled={isSaving} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput
              autoFocus
              required
              maxLength={100}
              autoComplete="off"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. Lakshmi Rao"
            />
          </Field>
          <Field label="Relationship">
            <SelectInput
              value={form.relationship}
              onChange={(event) =>
                updateField("relationship", event.target.value)
              }
            >
              {[
                "Mother",
                "Father",
                "Grandmother",
                "Grandfather",
                "Aunt",
                "Uncle",
              ].map((relationship) => (
                <option key={relationship}>{relationship}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Phone number">
            <TextInput
              required
              type="tel"
              inputMode="tel"
              autoComplete="off"
              aria-describedby={phoneHint}
              value={form.phoneNumber}
              onChange={(event) =>
                updateField("phoneNumber", event.target.value)
              }
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="Preferred call language">
            <SelectInput
              value={form.preferredLanguage}
              onChange={(event) =>
                updateField("preferredLanguage", event.target.value)
              }
            >
              {selectableCallLanguages.map((language) => (
                <option key={language}>{language}</option>
              ))}
              {!selectableCallLanguages.includes(
                form.preferredLanguage as never,
              ) ? (
                <option>{form.preferredLanguage}</option>
              ) : null}
            </SelectInput>
          </Field>
        </div>
        <p id={phoneHint} className="text-xs leading-5 text-sage-600">
          Use the number your parent answers. Indian mobile numbers can use 10
          digits; other numbers need a country code. Calling availability is
          checked after saving.
        </p>

        <details className="group border-t border-sage-100 pt-5">
          <summary className="focus-ring cursor-pointer rounded-md text-sm font-semibold text-care-ink">
            Additional details{" "}
            <span className="ml-1 font-normal text-sage-600">(optional)</span>
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Age">
              <TextInput
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                step={1}
                value={form.age}
                onChange={(event) => updateField("age", event.target.value)}
                placeholder="e.g. 72"
              />
            </Field>
            <Field label="City">
              <TextInput
                maxLength={150}
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="e.g. Hyderabad"
              />
            </Field>
            <Field label="Emergency contact name">
              <TextInput
                maxLength={100}
                autoComplete="off"
                value={form.emergencyContactName}
                onChange={(event) =>
                  updateField("emergencyContactName", event.target.value)
                }
                placeholder="Contact’s full name"
              />
            </Field>
            <Field label="Emergency contact phone">
              <TextInput
                type="tel"
                inputMode="tel"
                autoComplete="off"
                value={form.emergencyContactPhone}
                onChange={(event) =>
                  updateField("emergencyContactPhone", event.target.value)
                }
                placeholder="+91 98765 43210"
              />
            </Field>
          </div>
          <p className="mt-3 text-xs leading-5 text-sage-600">
            These details are saved with their profile. Emergency contacts are
            not called automatically.
          </p>
        </details>
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
          disabled={isSaving}
          icon={
            isSaving ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : undefined
          }
        >
          {isSaving ? "Saving…" : parent ? "Save changes" : "Add family member"}
        </Button>
      </div>
    </form>
  );
}
