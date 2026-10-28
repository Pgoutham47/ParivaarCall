import { canCallNumber } from "@/lib/calling-access";
import { isPresentationDemo } from "@/lib/demo-account";
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
    const [
      parents,
      { data: { user } },
    ] = await Promise.all([listParents(supabase), supabase.auth.getUser()]);
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
        presentationDemo={isPresentationDemo(user?.id)}
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
