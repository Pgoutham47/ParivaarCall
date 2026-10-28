import { MedicinesManager } from "@/components/dashboard/MedicinesManager";
import { listMedicineSchedules } from "@/lib/services/medicines";
import { listParents } from "@/lib/services/parents";
import { createClient } from "@/lib/supabase/server";

export default async function MedicinesPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string; add?: string }>;
}) {
  const { parent: initialParentId, add } = await searchParams;
  const supabase = await createClient();

  try {
    const [schedules, parents] = await Promise.all([
      listMedicineSchedules(supabase),
      listParents(supabase),
    ]);

    return (
      <MedicinesManager
        initialSchedules={schedules}
        parents={parents}
        initialParentId={initialParentId}
        initialAdd={add === "1"}
      />
    );
  } catch {
    return (
      <MedicinesManager
        initialSchedules={[]}
        parents={[]}
        initialError="We couldn’t load your medicine reminders. Please try again."
      />
    );
  }
}
