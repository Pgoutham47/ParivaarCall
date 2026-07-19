import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProtectedClient =
  | { ok: true; supabase: SupabaseClient<Database>; mode: "cron" | "development-user" }
  | { ok: false; status: number; message: string };

// Header-only on purpose: secrets in query strings end up in access logs and
// proxy history. Vercel cron sends CRON_SECRET as an Authorization bearer.
function requestSecret(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  return request.headers.get("x-cron-secret") ?? bearer;
}

function secretsMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function getProtectedCronClient(request: NextRequest): Promise<ProtectedClient> {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = requestSecret(request);

  if (cronSecret && providedSecret && secretsMatch(providedSecret, cronSecret)) {
    return { ok: true, supabase: createAdminClient(), mode: "cron" };
  }

  if (process.env.NODE_ENV !== "production") {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      return { ok: true, supabase, mode: "development-user" };
    }
  }

  return {
    ok: false,
    status: 401,
    message: "Unauthorized. Provide CRON_SECRET with Authorization: Bearer <secret> or x-cron-secret."
  };
}
