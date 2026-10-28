import { canCallNumber } from "@/lib/calling-access";
import { ParentsManager } from "@/components/dashboard/ParentsManager";
import { listParents } from "@/lib/services/parents";
import { createClient } from "@/lib/supabase/server";

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  const supabase = await createClient();

  try {
    const parents = await listParents(supabase);
    return (
      <ParentsManager
        initialParents={parents.map((parent) => ({
          ...parent,
          callingVerified: canCallNumber(
            parent.phoneNumber,
            parent.caregiverId,
          ),
        }))}
        initialAdd={add === "1"}
      />
    );
  } catch {
    return (
      <ParentsManager
        initialParents={[]}
        initialError="We couldn’t load your family profiles. Please try again."
      />
    );
  }
}
