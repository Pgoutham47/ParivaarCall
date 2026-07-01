import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
