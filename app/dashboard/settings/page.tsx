import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsManager } from "@/components/dashboard/settings/SettingsManager";
import { getOrCreateVoiceSettings } from "@/lib/services/settings";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  try {
    const settings = await getOrCreateVoiceSettings(supabase);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Preferences"
          title="Settings"
          description="Shape how future calls sound, retry, and notify the family."
        />
        <SettingsManager initialSettings={settings} />
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load settings.";

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Preferences"
          title="Settings"
          description="Shape how future calls sound, retry, and notify the family."
        />
        <SettingsManager initialSettings={null} initialError={message} />
      </div>
    );
  }
}
