import { MedicinesManager } from "@/components/dashboard/MedicinesManager";
import { listMedicineSchedules } from "@/lib/services/medicines";
import { listParents } from "@/lib/services/parents";
import { createClient } from "@/lib/supabase/server";

export default async function MedicinesPage() {
  const supabase = await createClient();

  try {
    const [schedules, parents] = await Promise.all([
      listMedicineSchedules(supabase),
      listParents(supabase)
    ]);

    return <MedicinesManager initialSchedules={schedules} parents={parents} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load medicine schedules.";
    return <MedicinesManager initialSchedules={[]} parents={[]} initialError={message} />;
  }
}
