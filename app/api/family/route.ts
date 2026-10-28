import { NextRequest, NextResponse } from "next/server";
import { authenticatedUser, validId } from "@/lib/services/user-api";
import { createParent, updateParent, mapParent } from "@/lib/services/parents";
import { createMedicineSchedule, updateMedicineSchedule, mapMedicine } from "@/lib/services/medicines";
import { generateCallLogForSchedule } from "@/lib/services/call-engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { canCallNumber } from "@/lib/calling-access";
import type { ParentInput, MedicineScheduleInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await authenticatedUser(request);
  if (!auth) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !["parent", "medicine"].includes(body.resource) || !["save", "status", "delete"].includes(body.action) || (body.id !== undefined && !validId(body.id)) || (body.action !== "save" && !body.id)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const admin = createAdminClient();
  const table = body.resource === "parent" ? "parents" : "medicine_schedules";
  const relation = body.resource === "parent" ? "parent_id" : "medicine_schedule_id";
  try {
    if (body.id) {
      const { data, error } = await auth.supabase.from(table).select("id").eq("id", body.id).maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Record not found." }, { status: 404 });
      const { count, error: countError } = await admin.from("call_logs").select("id", { count: "exact", head: true }).eq("caregiver_id", auth.user.id).eq(relation, body.id).eq("call_status", "calling");
      if (countError) throw countError;
      if (count) return NextResponse.json({ error: "A call is in progress. Please wait for it to finish before changing this record." }, { status: 409 });
    }
    let item;
    if (body.action === "save") {
      if (!body.input || typeof body.input !== "object") throw new Error("Please complete the form.");
      item = body.resource === "parent"
        ? body.id ? await updateParent(auth.supabase, body.id, body.input as ParentInput, auth.user.id) : await createParent(auth.supabase, body.input as ParentInput, auth.user.id)
        : body.id ? await updateMedicineSchedule(auth.supabase, body.id, body.input as MedicineScheduleInput, auth.user.id) : await createMedicineSchedule(auth.supabase, body.input as MedicineScheduleInput, auth.user.id);
    } else if (body.action === "status") {
      if (typeof body.active !== "boolean") throw new Error("Choose an active or paused status.");
      if (body.resource === "parent") {
        const { data, error } = await auth.supabase.from("parents").update({ status: body.active ? "active" : "inactive" }).eq("id", body.id).select("*").single();
        if (error) throw error;
        item = mapParent(data);
      } else {
        const { data, error } = await auth.supabase.from("medicine_schedules").update({ is_active: body.active }).eq("id", body.id).select("*, parents(name)").single();
        if (error) throw error;
        item = mapMedicine(data);
      }
    } else {
      // Delete pending attempts before deleting a medicine (its FK is SET NULL).
      const { error: cancelError } = await admin.from("call_logs").delete().eq("caregiver_id", auth.user.id).eq(relation, body.id).eq("call_status", "pending");
      if (cancelError) throw cancelError;
      const { error } = await auth.supabase.from(table).delete().eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ item: null });
    }
    const id = body.id ?? item?.id;
    // Refresh queued scripts after edits, including phone/language changes.
    if (body.id) {
      const { error } = await admin.from("call_logs").delete().eq("caregiver_id", auth.user.id).eq(relation, body.id).eq("call_status", "pending");
      if (error) throw error;
    }
    let message = "Changes saved.";
    try {
      if (body.resource === "medicine") {
        const result = await generateCallLogForSchedule(admin, id);
        if (result.outcome === "in_past") message = "Saved. Today's time has passed; the next eligible day will be scheduled. All times are India time (IST).";
      } else {
        const { data, error } = await admin.from("medicine_schedules").select("id").eq("caregiver_id", auth.user.id).eq("parent_id", id).eq("is_active", true);
        if (error) throw error;
        for (const schedule of data ?? []) await generateCallLogForSchedule(admin, schedule.id);
      }
    } catch {
      message = "Saved, but today's reminder could not be queued. Please edit and save it again or contact your account administrator.";
    }
    if (body.resource === "parent" && item && "phoneNumber" in item) {
      return NextResponse.json({ item: { ...item, callingVerified: canCallNumber(item.phoneNumber, auth.user.id) }, message });
    }
    return NextResponse.json({ item, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save changes. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
