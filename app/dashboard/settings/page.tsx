import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsManager } from "@/components/dashboard/settings/SettingsManager";
import { getOrCreateVoiceSettings } from "@/lib/services/settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Call preferences · ParivaarCall" };

export default async function SettingsPage() {
  const supabase = await createClient();

  try {
    const settings = await getOrCreateVoiceSettings(supabase);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Make it personal"
          title="Call preferences"
          description="Small details that make every reminder feel right for your family."
        />
        <SettingsManager initialSettings={settings} />
      </div>
    );
  } catch (error) {
    console.error("Could not load voice preferences:", error);
    const message =
      "Your saved preferences are temporarily unavailable. Reload this page to try again.";

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Make it personal"
          title="Call preferences"
          description="Small details that make every reminder feel right for your family."
        />
        <SettingsManager initialSettings={null} initialError={message} />
      </div>
    );
  }
}
