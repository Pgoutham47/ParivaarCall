import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Parent, ParentInput, ParentStatus } from "@/lib/types";
import { getCurrentUserId } from "@/lib/services/auth";

type ParentRow = Database["public"]["Tables"]["parents"]["Row"];

function mapParent(row: ParentRow): Parent {
  return {
    id: row.id,
    caregiverId: row.caregiver_id,
    name: row.name,
    relationship: row.relationship,
    phoneNumber: row.phone,
    age: row.age,
    preferredLanguage: row.language,
    city: row.city,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    status: (row.status ?? "active") as ParentStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toParentPayload(input: ParentInput, caregiverId: string) {
  return {
    caregiver_id: caregiverId,
    name: input.name.trim(),
    relationship: input.relationship,
    phone: input.phoneNumber.trim(),
    age: input.age,
    language: input.preferredLanguage,
    city: input.city,
    emergency_contact_name: input.emergencyContactName,
    emergency_contact_phone: input.emergencyContactPhone,
    status: input.status ?? "active"
  };
}

export async function listParents(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.from("parents").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapParent);
}

export async function createParent(supabase: SupabaseClient<Database>, input: ParentInput) {
  const caregiverId = await getCurrentUserId(supabase);
  const { data, error } = await supabase
    .from("parents")
    .insert(toParentPayload(input, caregiverId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapParent(data);
}

export async function updateParent(supabase: SupabaseClient<Database>, id: string, input: ParentInput) {
  const caregiverId = await getCurrentUserId(supabase);
  const { data, error } = await supabase
    .from("parents")
    .update(toParentPayload(input, caregiverId))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapParent(data);
}

export async function deactivateParent(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("parents")
    .update({ status: "inactive" })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapParent(data);
}
