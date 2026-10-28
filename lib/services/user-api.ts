import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function authenticatedUser(request: NextRequest) {
  // Cookie-authenticated mutation endpoints are same-origin only.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return null;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return user && !error ? { supabase, user } : null;
}
export const validId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
