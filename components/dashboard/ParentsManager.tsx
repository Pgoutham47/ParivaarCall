"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Languages,
  MapPin,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { ParentForm } from "@/components/forms/ParentForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { familyAction } from "@/lib/family-api";
import { TestCallButton } from "@/components/dashboard/calls/TestCallButton";
import type { Parent, ParentInput } from "@/lib/types";

export function ParentsManager({
  initialParents,
  initialError,
  initialAdd = false,
  presentationDemo = false,
}: {
  initialParents: Parent[];
  initialError?: string;
  initialAdd?: boolean;
  presentationDemo?: boolean;
}) {
  const router = useRouter();
  const handledAdd = useRef(initialAdd);
  const [parents, setParents] = useState<Parent[]>(initialParents);
  const [showForm, setShowForm] = useState(initialAdd);
  const [editingParent, setEditingParent] = useState<Parent | undefined>();
  const [deletingParent, setDeletingParent] = useState<Parent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workingParentId, setWorkingParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setParents(initialParents);
  }, [initialParents]);
  useEffect(() => {
    setError(initialError ?? null);
  }, [initialError]);
  useEffect(() => {
    if (initialAdd === handledAdd.current) return;
    handledAdd.current = initialAdd;
    setEditingParent(undefined);
    setError(null);
    if (initialAdd) setMessage(null);
    setShowForm(initialAdd);
  }, [initialAdd]);

  function openForm(parent?: Parent) {
    setEditingParent(parent);
    setError(null);
    setMessage(null);
    setShowForm(true);
  }

  function closeForm() {
    if (isSaving) return;
    setShowForm(false);
    setEditingParent(undefined);
    setError(null);
    if (initialAdd) router.replace("/dashboard/parents", { scroll: false });
  }

  async function handleSave(input: ParentInput) {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const { item: savedParent, message: savedMessage } =
        await familyAction<Parent>("parent", "save", {
          id: editingParent?.id,
          input,
        });
      setParents((current) =>
        editingParent
          ? current.map((item) =>
              item.id === savedParent.id ? savedParent : item,
            )
          : [savedParent, ...current],
      );
      setMessage(
        savedMessage ?? `${savedParent.name}’s profile has been saved.`,
      );
      setShowForm(false);
      setEditingParent(undefined);
      if (initialAdd) router.replace("/dashboard/parents", { scroll: false });
      else router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save this profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(parent: Parent) {
    if (workingParentId) return;
    setWorkingParentId(parent.id);
    setError(null);
    setMessage(null);
    try {
      const { item: updatedParent, message: savedMessage } =
        await familyAction<Parent>("parent", "status", {
          id: parent.id,
          active: parent.status !== "active",
        });
      setParents((current) =>
        current.map((item) => (item.id === parent.id ? updatedParent : item)),
      );
      setMessage(
        savedMessage && savedMessage !== "Changes saved."
          ? savedMessage
          : `${parent.name}’s calls are ${updatedParent.status === "active" ? "active again" : "paused"}.`,
      );
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update calling status. Please try again.",
      );
    } finally {
      setWorkingParentId(null);
    }
  }

  async function handleDelete() {
    if (!deletingParent || workingParentId) return;
    const parent = deletingParent;
    setWorkingParentId(parent.id);
    setError(null);
    setMessage(null);
    try {
      await familyAction("parent", "delete", { id: parent.id });
      setParents((current) => current.filter((item) => item.id !== parent.id));
      setDeletingParent(null);
      setMessage(`${parent.name}’s profile has been removed.`);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not remove this profile. Please try again.",
      );
    } finally {
      setWorkingParentId(null);
    }
  }

  const activeCount = parents.filter(
    (parent) => parent.status === "active",
  ).length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Family care"
        title="Your family"
        description="A little care, tailored to each person you love."
        action={
          <Button
            type="button"
            onClick={() => openForm()}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Add family member
          </Button>
        }
      />

      {error && !showForm && !deletingParent ? (
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

      {parents.length === 0 && !initialError ? (
        <Card className="px-6 py-16 text-center sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-50 text-sage-700">
            <UsersRound
              className="h-7 w-7"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-care-ink">
            Care starts with someone you love.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-sage-600">
            Add your parent’s name, phone number, and preferred language. Then
            build a medicine routine around their day.
          </p>
          <Button
            className="mt-7"
            type="button"
            onClick={() => openForm()}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Add your first family member
          </Button>
          <p className="mt-4 text-xs text-sage-600">
            They won’t need an app or a new device.
          </p>
        </Card>
      ) : parents.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-sage-600">
            <p>
              <span className="font-semibold text-care-ink">
                {parents.length}
              </span>{" "}
              {parents.length === 1 ? "family member" : "family members"}
            </p>
            <p>
              {activeCount} active · {parents.length - activeCount} paused
            </p>
          </div>
          <section
            aria-label="Family members"
            className="grid gap-5 xl:grid-cols-2"
          >
            {parents.map((parent) => (
              <Card key={parent.id} className="overflow-hidden p-0">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-100 text-lg font-medium text-sage-800"
                        aria-hidden="true"
                      >
                        {parent.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-semibold tracking-tight text-care-ink">
                          {parent.name}
                        </h2>
                        <p className="mt-0.5 text-sm text-sage-600">
                          {parent.relationship}
                          {parent.age ? ` · ${parent.age} years` : ""}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      label={parent.status === "active" ? "Active" : "Paused"}
                      tone={parent.status === "active" ? "green" : "neutral"}
                    />
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-sage-600">
                        Reminder phone
                      </p>
                      <p className="mt-1 font-medium tabular-nums text-care-ink">
                        {parent.phoneNumber}
                      </p>
                      <p
                        className={`mt-1.5 flex items-center gap-1 text-xs ${presentationDemo || parent.callingVerified ? "text-sage-700" : "text-amber-800"}`}
                      >
                        {!presentationDemo && parent.callingVerified ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : null}
                        {presentationDemo
                          ? "Calls disabled"
                          : parent.callingVerified
                            ? "Verified for calls"
                            : "Number verification needed"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm text-sage-700">
                        <Languages
                          className="h-4 w-4 text-sage-500"
                          aria-hidden="true"
                        />
                        {parent.preferredLanguage}
                      </p>
                      {parent.city ? (
                        <p className="flex items-center gap-2 break-words text-sm text-sage-700">
                          <MapPin
                            className="h-4 w-4 shrink-0 text-sage-500"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 break-words">
                            {parent.city}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {!presentationDemo && !parent.callingVerified ? (
                    <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
                      Ask your account administrator to verify this number
                      before starting calls. You can set up their routine now.
                    </p>
                  ) : null}
                  {!presentationDemo && parent.status !== "active" ? (
                    <p className="mt-4 text-xs leading-5 text-sage-600">
                      Reminder calls are paused. Resume calls when they’re
                      ready.
                    </p>
                  ) : null}
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <TestCallButton
                      parent={parent}
                      disabled={workingParentId !== null}
                      presentationDemo={presentationDemo}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      icon={
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      }
                      onClick={() => openForm(parent)}
                      disabled={workingParentId !== null}
                    >
                      Edit profile
                    </Button>
                  </div>
                </div>
                <div className="border-t border-sage-100 px-5 py-3 sm:px-6">
                  {parent.status === "active" ? (
                    <Link
                      href={`/dashboard/medicines?parent=${parent.id}`}
                      className="focus-ring mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm font-medium text-sage-700"
                    >
                      Add a medicine reminder
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </Link>
                  ) : null}
                  <details className="group">
                    <summary className="focus-ring cursor-pointer rounded-md text-xs font-medium text-sage-600">
                      More profile options
                    </summary>
                    {parent.emergencyContactName ||
                    parent.emergencyContactPhone ? (
                      <div className="mt-3 break-words text-xs leading-5 text-sage-600">
                        <p className="font-semibold">Emergency contact</p>
                        <p>
                          {parent.emergencyContactName}
                          {parent.emergencyContactPhone
                            ? ` · ${parent.emergencyContactPhone}`
                            : ""}
                        </p>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={workingParentId !== null}
                        icon={
                          parent.status === "active" ? (
                            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Play className="h-3.5 w-3.5" aria-hidden="true" />
                          )
                        }
                        onClick={() => handleDeactivate(parent)}
                      >
                        {workingParentId === parent.id
                          ? "Updating…"
                          : parent.status === "active"
                            ? "Pause calls"
                            : "Resume calls"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-rose-700 hover:bg-rose-50"
                        disabled={workingParentId !== null}
                        icon={
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        }
                        onClick={() => {
                          setError(null);
                          setDeletingParent(parent);
                        }}
                      >
                        Remove profile
                      </Button>
                    </div>
                  </details>
                </div>
              </Card>
            ))}
          </section>
        </>
      ) : null}

      {showForm ? (
        <Dialog
          open
          dismissible={!isSaving}
          onClose={closeForm}
          title={
            editingParent
              ? `Edit ${editingParent.name}’s profile`
              : "Add a family member"
          }
          description="Their everyday phone and preferred language are all you need to get started."
          size="lg"
        >
          {error ? (
            <p role="alert" className="notice-error mb-4">
              {error}
            </p>
          ) : null}
          <ParentForm
            key={editingParent?.id ?? "new"}
            parent={editingParent}
            isSaving={isSaving}
            onCancel={closeForm}
            onSave={handleSave}
          />
        </Dialog>
      ) : null}

      <Dialog
        open={Boolean(deletingParent)}
        dismissible={workingParentId === null}
        onClose={() => {
          if (!workingParentId) {
            setDeletingParent(null);
            setError(null);
          }
        }}
        title={`Remove ${deletingParent?.name ?? "this family member"}?`}
        description="This permanently removes their profile, medicine schedules, call history, and alerts. This cannot be undone."
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
            onClick={() => {
              setDeletingParent(null);
              setError(null);
            }}
            disabled={workingParentId !== null}
          >
            Keep profile
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={workingParentId !== null}
          >
            {workingParentId ? "Removing…" : "Remove permanently"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
