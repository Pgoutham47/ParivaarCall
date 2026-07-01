import { ParentsManager } from "@/components/dashboard/ParentsManager";
import { listParents } from "@/lib/services/parents";
import { createClient } from "@/lib/supabase/server";

export default async function ParentsPage() {
  const supabase = await createClient();

  try {
    const parents = await listParents(supabase);
    return <ParentsManager initialParents={parents} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load parents.";
    return <ParentsManager initialParents={[]} initialError={message} />;
  }
}
