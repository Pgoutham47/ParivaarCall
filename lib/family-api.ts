export async function familyAction<T>(resource: "parent" | "medicine", action: "save" | "status" | "delete", values: { id?: string; input?: unknown; active?: boolean }): Promise<{ item: T; message?: string }> {
  const response = await fetch("/api/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource, action, ...values }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Could not save changes. Please try again.");
  return payload;
}
