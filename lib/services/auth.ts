import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function getCurrentUserId(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("You must be logged in to continue.");
  }

  return user.id;
}

export async function upsertProfile(
  supabase: SupabaseClient<Database>,
  input: { id: string; fullName?: string | null; phone?: string | null }
) {
  const { error } = await supabase.from("profiles").upsert({
    id: input.id,
    full_name: input.fullName ?? null,
    phone: input.phone ?? null
  });

  if (error) {
    throw new Error(error.message);
  }
}
