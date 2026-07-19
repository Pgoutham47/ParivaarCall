"use client";

import { Pencil, Plus, ToggleLeft } from "lucide-react";
import { useState } from "react";
import { MedicineForm } from "@/components/forms/MedicineForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatEnum } from "@/lib/utils";
import { generateCallLogForSchedule } from "@/lib/services/call-engine";
import {
  createMedicineSchedule,
  deactivateMedicineSchedule,
  updateMedicineSchedule
} from "@/lib/services/medicines";
import { createClient } from "@/lib/supabase/client";
import type { MedicineSchedule, MedicineScheduleInput, Parent } from "@/lib/types";

export function MedicinesManager({
  initialSchedules,
  parents,
  initialError
}: {
  initialSchedules: MedicineSchedule[];
  parents: Parent[];
  initialError?: string;
}) {
  const [schedules, setSchedules] = useState<MedicineSchedule[]>(initialSchedules);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MedicineSchedule | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [workingScheduleId, setWorkingScheduleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function handleSave(input: MedicineScheduleInput) {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const savedSchedule = editingSchedule
        ? await updateMedicineSchedule(supabase, editingSchedule.id, input)
        : await createMedicineSchedule(supabase, input);

      // Schedule today's call right away. Without this the medicine would wait
      // for the nightly generator, so a reminder added during the day would
      // never fire today.
      try {
        await generateCallLogForSchedule(supabase, savedSchedule.id);
      } catch {
        // The nightly generator will still pick this up; saving must not fail.
      }

      setSchedules((current) =>
        editingSchedule
          ? current.map((item) => (item.id === savedSchedule.id ? savedSchedule : item))
          : [savedSchedule, ...current]
      );
      setShowForm(false);
      setEditingSchedule(undefined);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save medicine schedule.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(schedule: MedicineSchedule) {
    setWorkingScheduleId(schedule.id);
    setError(null);

    try {
      const supabase = createClient();
      const updatedSchedule = await deactivateMedicineSchedule(supabase, schedule.id);
      setSchedules((current) => current.map((item) => (item.id === schedule.id ? updatedSchedule : item)));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not deactivate medicine schedule.");
    } finally {
      setWorkingScheduleId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Routine"
        title="Medicines"
        description="Build the reminder schedule that future phone calls will follow."
        action={
          <Button
            onClick={() => {
              setEditingSchedule(undefined);
              setShowForm(true);
            }}
            disabled={parents.length === 0}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Add Medicine
          </Button>
        }
      />

      {error ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      {parents.length === 0 ? (
        <Card>
          <p className="text-base font-semibold text-care-ink">Add a parent first</p>
          <p className="mt-2 text-sm leading-6 text-sage-700">Medicine schedules need a parent to receive the reminder call.</p>
        </Card>
      ) : null}

      {showForm ? (
        <Card>
          <h2 className="mb-4 text-xl font-bold text-care-ink">{editingSchedule ? "Edit medicine" : "Add medicine"}</h2>
          <MedicineForm
            parents={parents.filter((parent) => parent.status !== "inactive")}
            schedule={editingSchedule}
            isSaving={isSaving}
            onCancel={() => {
              setShowForm(false);
              setEditingSchedule(undefined);
            }}
            onSave={handleSave}
          />
        </Card>
      ) : null}

      {schedules.length === 0 ? (
        <Card>
          <p className="text-base font-semibold text-care-ink">No medicine schedules yet</p>
          <p className="mt-2 text-sm leading-6 text-sage-700">Add a medicine schedule to make it appear on the dashboard.</p>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-care-ink">{schedule.medicineName}</h2>
                  <p className="mt-1 text-sm text-sage-700">{schedule.parentName}</p>
                </div>
                <StatusBadge
                  label={schedule.isActive ? schedule.importanceLevel : "inactive"}
                  tone={!schedule.isActive ? "neutral" : schedule.importanceLevel === "important" ? "red" : "neutral"}
                />
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="font-semibold text-sage-900">Time</dt>
                  <dd className="text-sage-700">{schedule.time}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sage-900">Food timing</dt>
                  <dd className="text-sage-700">{formatEnum(schedule.mealTiming)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sage-900">Frequency</dt>
                  <dd className="text-sage-700">{formatEnum(schedule.frequency)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-sage-900">Instruction</dt>
                  <dd className="text-sage-700">{schedule.dosageInstruction || "Not set"}</dd>
                </div>
              </dl>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    setEditingSchedule(schedule);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={workingScheduleId === schedule.id || !schedule.isActive}
                  icon={<ToggleLeft className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => handleDeactivate(schedule)}
                >
                  {workingScheduleId === schedule.id ? "Updating..." : "Deactivate"}
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
