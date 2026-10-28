"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Pause,
  Pencil,
  Pill,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { MedicineForm } from "@/components/forms/MedicineForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { SelectInput, TextInput } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { familyAction } from "@/lib/family-api";
import { localDateKey } from "@/lib/services/timezone";
import type {
  MedicineSchedule,
  MedicineScheduleInput,
  Parent,
} from "@/lib/types";

function displayTime(time: string) {
  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

function repeatLabel(schedule: MedicineSchedule) {
  if (schedule.frequency === "weekly" && schedule.startDate)
    return `Every ${new Date(`${schedule.startDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long" })}`;
  return schedule.frequency === "daily" ? "Every day" : "Weekly";
}

export function MedicinesManager({
  initialSchedules,
  parents,
  initialError,
  initialParentId,
  initialAdd = false,
}: {
  initialSchedules: MedicineSchedule[];
  parents: Parent[];
  initialError?: string;
  initialParentId?: string;
  initialAdd?: boolean;
}) {
  const router = useRouter();
  const activeParents = parents.filter((parent) => parent.status === "active");
  const preselectedParent = activeParents.find(
    (parent) => parent.id === initialParentId,
  );
  const formIntent = preselectedParent
    ? `parent:${preselectedParent.id}`
    : initialAdd && activeParents.length > 0
      ? "add"
      : null;
  const handledFormIntent = useRef(formIntent);
  const [schedules, setSchedules] =
    useState<MedicineSchedule[]>(initialSchedules);
  const [showForm, setShowForm] = useState(Boolean(formIntent));
  const [editingSchedule, setEditingSchedule] = useState<
    MedicineSchedule | undefined
  >();
  const [deletingSchedule, setDeletingSchedule] =
    useState<MedicineSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workingScheduleId, setWorkingScheduleId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [query, setQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const today = localDateKey();

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);
  useEffect(() => {
    setError(initialError ?? null);
  }, [initialError]);
  useEffect(() => {
    if (
      parentFilter !== "all" &&
      !parents.some((parent) => parent.id === parentFilter)
    )
      setParentFilter("all");
  }, [parents, parentFilter]);
  useEffect(() => {
    if (formIntent === handledFormIntent.current) return;
    handledFormIntent.current = formIntent;
    setEditingSchedule(undefined);
    setError(null);
    if (formIntent) setMessage(null);
    setShowForm(Boolean(formIntent));
  }, [formIntent]);

  function scheduleState(schedule: MedicineSchedule) {
    const parent = parents.find((item) => item.id === schedule.parentId);
    if (!schedule.isActive || parent?.status !== "active") return "paused";
    if (schedule.endDate && schedule.endDate < today) return "ended";
    if (schedule.startDate && schedule.startDate > today) return "upcoming";
    return "active";
  }

  function openForm(schedule?: MedicineSchedule) {
    setEditingSchedule(schedule);
    setError(null);
    setMessage(null);
    setShowForm(true);
  }

  function closeForm() {
    if (isSaving) return;
    setShowForm(false);
    setEditingSchedule(undefined);
    setError(null);
    if (initialParentId || initialAdd)
      router.replace("/dashboard/medicines", { scroll: false });
  }

  async function handleSave(input: MedicineScheduleInput) {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const { item: savedSchedule, message: savedMessage } =
        await familyAction<MedicineSchedule>("medicine", "save", {
          id: editingSchedule?.id,
          input,
        });
      setSchedules((current) =>
        editingSchedule
          ? current.map((item) =>
              item.id === savedSchedule.id ? savedSchedule : item,
            )
          : [savedSchedule, ...current],
      );
      setMessage(savedMessage ?? "Your medicine reminder has been saved.");
      setQuery("");
      setParentFilter("all");
      setStatusFilter("all");
      setShowForm(false);
      setEditingSchedule(undefined);
      if (initialParentId || initialAdd)
        router.replace("/dashboard/medicines", { scroll: false });
      else router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save this reminder. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(schedule: MedicineSchedule) {
    if (workingScheduleId) return;
    setWorkingScheduleId(schedule.id);
    setError(null);
    setMessage(null);
    try {
      const { item: updatedSchedule, message: savedMessage } =
        await familyAction<MedicineSchedule>("medicine", "status", {
          id: schedule.id,
          active: !schedule.isActive,
        });
      setSchedules((current) =>
        current.map((item) =>
          item.id === schedule.id ? updatedSchedule : item,
        ),
      );
      setMessage(
        savedMessage && savedMessage !== "Changes saved."
          ? savedMessage
          : `${schedule.medicineName} reminder ${updatedSchedule.isActive ? "resumed" : "paused"}.`,
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update this reminder. Please try again.",
      );
    } finally {
      setWorkingScheduleId(null);
    }
  }

  async function handleDelete() {
    if (!deletingSchedule || workingScheduleId) return;
    const schedule = deletingSchedule;
    setWorkingScheduleId(schedule.id);
    setError(null);
    setMessage(null);
    try {
      await familyAction("medicine", "delete", { id: schedule.id });
      setSchedules((current) =>
        current.filter((item) => item.id !== schedule.id),
      );
      setDeletingSchedule(null);
      setMessage(
        `${schedule.medicineName} reminder removed. Completed call history is still available.`,
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not remove this reminder. Please try again.",
      );
    } finally {
      setWorkingScheduleId(null);
    }
  }

  const filteredSchedules = schedules
    .filter((schedule) => {
      const searchMatch =
        `${schedule.medicineName} ${schedule.parentName} ${schedule.dosageInstruction ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      return (
        searchMatch &&
        (parentFilter === "all" || schedule.parentId === parentFilter) &&
        (statusFilter === "all" || scheduleState(schedule) === statusFilter)
      );
    })
    .sort(
      (a, b) =>
        a.time.localeCompare(b.time) ||
        a.parentName.localeCompare(b.parentName),
    );

  function clearFilters() {
    setQuery("");
    setParentFilter("all");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Daily routines"
        title="Medicine reminders"
        description="Simple routines that fit around your family’s day."
        action={
          <Button
            type="button"
            onClick={() => openForm()}
            disabled={activeParents.length === 0}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Add reminder
          </Button>
        }
      />
      {error && !showForm && !deletingSchedule ? (
        <div role="alert" className="notice-error">
          {error}
          {initialError ? (
            <button
              type="button"
              className="focus-ring ml-2 rounded font-semibold underline underline-offset-4"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
      {message ? (
        <p role="status" className="notice-success">
          {message}
        </p>
      ) : null}

      {!initialError && activeParents.length === 0 ? (
        <Card className="flex flex-col items-start justify-between gap-4 bg-sage-50/50 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-care-ink">
              {parents.length
                ? "Resume a family member’s calls"
                : "First, add someone to care for"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-sage-600">
              {parents.length
                ? "All family profiles are paused. Resume calls from Your family before adding a new reminder."
                : "A family profile gives each reminder a person, a phone number, and a preferred language."}
            </p>
          </div>
          <LinkButton
            href={
              parents.length ? "/dashboard/parents" : "/dashboard/parents?add=1"
            }
            variant="secondary"
            className="shrink-0"
          >
            {parents.length ? "Manage family" : "Add family member"}
          </LinkButton>
        </Card>
      ) : null}

      {schedules.length === 0 && activeParents.length > 0 && !initialError ? (
        <Card className="px-6 py-16 text-center sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-50 text-sage-700">
            <Pill className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-care-ink">
            Make their daily routine a little easier.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-sage-600">
            Choose a medicine, a call time, and how often it repeats. We’ll use
            those details for their reminder calls.
          </p>
          <Button
            className="mt-7"
            type="button"
            onClick={() => openForm()}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Create the first reminder
          </Button>
        </Card>
      ) : schedules.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-sage-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <label className="block min-w-0 flex-1">
                <span className="mb-1.5 block text-xs font-medium text-sage-600">
                  Find a reminder
                </span>
                <span className="relative block">
                  <Search
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-sage-500"
                    aria-hidden="true"
                  />
                  <TextInput
                    type="search"
                    className="pl-9"
                    placeholder="Search medicine or family member"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3 lg:w-[340px]">
                <label className="min-w-0">
                  <span className="mb-1.5 block text-xs font-medium text-sage-600">
                    Family member
                  </span>
                  <SelectInput
                    value={parentFilter}
                    onChange={(event) => setParentFilter(event.target.value)}
                  >
                    <option value="all">Everyone</option>
                    {parents.map((parent) => (
                      <option value={parent.id} key={parent.id}>
                        {parent.name}
                      </option>
                    ))}
                  </SelectInput>
                </label>
                <label className="min-w-0">
                  <span className="mb-1.5 block text-xs font-medium text-sage-600">
                    Status
                  </span>
                  <SelectInput
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All reminders</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="paused">Paused</option>
                    <option value="ended">Ended</option>
                  </SelectInput>
                </label>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-sage-50/60 px-5 py-3 text-xs text-sage-600">
            <p role="status">
              {filteredSchedules.length} of {schedules.length}{" "}
              {schedules.length === 1 ? "reminder" : "reminders"}
            </p>
            <p className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              All times in India (IST)
            </p>
          </div>
          {filteredSchedules.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <h2 className="font-semibold text-care-ink">
                No matching reminders
              </h2>
              <p className="mt-2 text-sm text-sage-600">
                Try another name or show all your reminders.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-5"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-sage-100">
              {filteredSchedules.map((schedule) => {
                const state = scheduleState(schedule);
                const parentPaused =
                  parents.find((parent) => parent.id === schedule.parentId)
                    ?.status !== "active";
                return (
                  <li
                    key={schedule.id}
                    className="p-5 transition-colors hover:bg-sage-50/30 sm:p-6"
                  >
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(130px,0.8fr)_minmax(120px,0.8fr)_auto] xl:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="min-w-0 break-words text-base font-semibold text-care-ink">
                            {schedule.medicineName}
                          </h2>
                          {schedule.importanceLevel === "important" ? (
                            <span className="text-[11px] font-medium text-amber-800">
                              Important
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 break-words text-sm text-sage-600">
                          For {schedule.parentName}
                        </p>
                        {schedule.dosageInstruction ? (
                          <p className="mt-2 break-words text-sm leading-6 text-sage-700">
                            {schedule.dosageInstruction}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-base font-semibold tabular-nums text-care-ink">
                          {displayTime(schedule.time)}
                        </p>
                        <p className="mt-1 text-xs text-sage-600">
                          {schedule.mealTiming === "before_food"
                            ? "Before food"
                            : "After food"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-care-ink">
                          {repeatLabel(schedule)}
                        </p>
                        <div className="mt-2">
                          <StatusBadge
                            label={state}
                            tone={
                              state === "active"
                                ? "green"
                                : state === "upcoming"
                                  ? "blue"
                                  : "neutral"
                            }
                          />
                        </div>
                        {parentPaused ? (
                          <p className="mt-1.5 text-xs text-sage-600">
                            Family member paused
                          </p>
                        ) : null}
                        {state === "upcoming" ? (
                          <p className="mt-1.5 text-xs text-sage-600">
                            Starts {schedule.startDate}
                          </p>
                        ) : null}
                        {state === "ended" ? (
                          <p className="mt-1.5 text-xs text-sage-600">
                            Ended {schedule.endDate}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-fit"
                        icon={
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        }
                        onClick={() => openForm(schedule)}
                        disabled={workingScheduleId !== null}
                      >
                        Edit reminder
                      </Button>
                    </div>
                    <details className="mt-4 border-t border-sage-100/70 pt-3">
                      <summary className="focus-ring w-fit cursor-pointer rounded text-xs font-medium text-sage-600">
                        Schedule details & options
                      </summary>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs leading-5 text-sage-600">
                          Starts {schedule.startDate ?? "when saved"}
                          {schedule.endDate
                            ? ` · Ends ${schedule.endDate}`
                            : " · No end date"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={
                              workingScheduleId !== null ||
                              (!schedule.isActive && parentPaused)
                            }
                            icon={
                              schedule.isActive ? (
                                <Pause
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Play
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )
                            }
                            onClick={() => handleDeactivate(schedule)}
                          >
                            {workingScheduleId === schedule.id
                              ? "Updating…"
                              : schedule.isActive
                                ? "Pause reminder"
                                : "Resume reminder"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-rose-700 hover:bg-rose-50"
                            disabled={workingScheduleId !== null}
                            icon={
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            }
                            onClick={() => {
                              setError(null);
                              setDeletingSchedule(schedule);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : null}

      {showForm ? (
        <Dialog
          open
          dismissible={!isSaving}
          onClose={closeForm}
          title={
            editingSchedule
              ? "Edit medicine reminder"
              : "Create a medicine reminder"
          }
          description="Set the routine once. Your family member receives a reminder on their phone."
          size="lg"
        >
          {error ? (
            <p role="alert" className="notice-error mb-4">
              {error}
            </p>
          ) : null}
          <MedicineForm
            key={
              editingSchedule?.id ?? `new:${preselectedParent?.id ?? "default"}`
            }
            parents={parents.filter(
              (parent) =>
                parent.status === "active" ||
                parent.id === editingSchedule?.parentId,
            )}
            schedule={editingSchedule}
            initialParentId={preselectedParent?.id}
            isSaving={isSaving}
            onCancel={closeForm}
            onSave={handleSave}
          />
        </Dialog>
      ) : null}
      <Dialog
        open={Boolean(deletingSchedule)}
        dismissible={workingScheduleId === null}
        onClose={() => {
          if (!workingScheduleId) {
            setDeletingSchedule(null);
            setError(null);
          }
        }}
        title={`Remove ${deletingSchedule?.medicineName ?? "this reminder"}?`}
        description="This stops future reminders and removes queued calls for this medicine. Completed call history will remain available."
      >
        {error ? (
          <p role="alert" className="notice-error mb-4">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={workingScheduleId !== null}
            onClick={() => {
              setDeletingSchedule(null);
              setError(null);
            }}
          >
            Keep reminder
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={workingScheduleId !== null}
            onClick={handleDelete}
          >
            {workingScheduleId ? "Removing…" : "Remove reminder"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
