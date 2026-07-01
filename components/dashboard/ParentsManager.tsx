"use client";

import { Pencil, Plus, UserMinus } from "lucide-react";
import { useState } from "react";
import { ParentForm } from "@/components/forms/ParentForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createParent, deactivateParent, updateParent } from "@/lib/services/parents";
import { createClient } from "@/lib/supabase/client";
import type { Parent, ParentInput } from "@/lib/types";

export function ParentsManager({
  initialParents,
  initialError
}: {
  initialParents: Parent[];
  initialError?: string;
}) {
  const [parents, setParents] = useState<Parent[]>(initialParents);
  const [showForm, setShowForm] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [workingParentId, setWorkingParentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function handleSave(input: ParentInput) {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const savedParent = editingParent
        ? await updateParent(supabase, editingParent.id, input)
        : await createParent(supabase, input);

      setParents((current) =>
        editingParent
          ? current.map((item) => (item.id === savedParent.id ? savedParent : item))
          : [savedParent, ...current]
      );
      setShowForm(false);
      setEditingParent(undefined);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save parent.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(parent: Parent) {
    setWorkingParentId(parent.id);
    setError(null);

    try {
      const supabase = createClient();
      const updatedParent = await deactivateParent(supabase, parent.id);
      setParents((current) => current.map((item) => (item.id === parent.id ? updatedParent : item)));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not deactivate parent.");
    } finally {
      setWorkingParentId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Family"
        title="Parents"
        description="Add the people who should receive medicine reminder calls."
        action={
          <Button
            onClick={() => {
              setEditingParent(undefined);
              setShowForm(true);
            }}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Add Parent
          </Button>
        }
      />

      {error ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      {showForm ? (
        <Card>
          <h2 className="mb-4 text-xl font-bold text-care-ink">{editingParent ? "Edit parent" : "Add parent"}</h2>
          <ParentForm
            parent={editingParent}
            isSaving={isSaving}
            onCancel={() => {
              setShowForm(false);
              setEditingParent(undefined);
            }}
            onSave={handleSave}
          />
        </Card>
      ) : null}

      {parents.length === 0 ? (
        <Card>
          <p className="text-base font-semibold text-care-ink">No parents added yet</p>
          <p className="mt-2 text-sm leading-6 text-sage-700">Add your first parent to start building their medicine routine.</p>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {parents.map((parent) => (
            <Card key={parent.id} className="flex h-full flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-care-ink">{parent.name}</h2>
                    <p className="mt-1 text-sm text-sage-700">{parent.relationship}</p>
                  </div>
                  <StatusBadge label={parent.status} tone={parent.status === "active" ? "green" : "amber"} />
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-sage-900">Phone number</dt>
                    <dd className="text-sage-700">{parent.phoneNumber}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-sage-900">Language</dt>
                    <dd className="text-sage-700">{parent.preferredLanguage}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-sage-900">City</dt>
                    <dd className="text-sage-700">{parent.city || "Not set"}</dd>
                  </div>
                </dl>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => {
                      setEditingParent(parent);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={workingParentId === parent.id || parent.status === "inactive"}
                    icon={<UserMinus className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => handleDeactivate(parent)}
                  >
                    {workingParentId === parent.id ? "Updating..." : "Mark inactive"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
