"use client";

import { Languages, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { updateVoiceSettings } from "@/lib/services/settings";
import { createClient } from "@/lib/supabase/client";
import type { RespectMode, VoiceSettings, VoiceSettingsInput } from "@/lib/types";

export function SettingsManager({
  initialSettings,
  initialError
}: {
  initialSettings: VoiceSettings | null;
  initialError?: string;
}) {
  const [settings, setSettings] = useState<VoiceSettingsInput>(() => ({
    languagePreference: initialSettings?.languagePreference ?? "Telugu",
    respectMode: initialSettings?.respectMode ?? "formal",
    retryAttempts: initialSettings?.retryAttempts ?? 2,
    retryGapMinutes: initialSettings?.retryGapMinutes ?? 10
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  function updateField<Key extends keyof VoiceSettingsInput>(field: Key, value: VoiceSettingsInput[Key]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setSavedMessage(null);
    setError(null);

    try {
      const supabase = createClient();
      const savedSettings = await updateVoiceSettings(supabase, settings);
      setSettings({
        languagePreference: savedSettings.languagePreference,
        respectMode: savedSettings.respectMode,
        retryAttempts: savedSettings.retryAttempts,
        retryGapMinutes: savedSettings.retryGapMinutes
      });
      setSavedMessage("Settings saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {error ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
      {savedMessage ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{savedMessage}</p> : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <Languages className="h-6 w-6 text-sage-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-care-ink">Voice language preference</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Default call language">
              <SelectInput
                value={settings.languagePreference}
                onChange={(event) => updateField("languagePreference", event.target.value)}
              >
                <option>Parent preferred language</option>
                <option>Hindi</option>
                <option>Telugu</option>
                <option>Tamil</option>
                <option>Kannada</option>
                <option>English</option>
              </SelectInput>
            </Field>
            <Field label="Respect mode">
              <SelectInput
                value={settings.respectMode}
                onChange={(event) => updateField("respectMode", event.target.value as RespectMode)}
              >
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </SelectInput>
            </Field>
          </div>
          <p className="mt-4 text-sm leading-6 text-sage-700">
            The language decides which script is written and which language the voice agent speaks. Respect mode changes how the parent is addressed. Voice, speed, and tone are configured on the Bolna agent.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <RotateCcw className="h-6 w-6 text-sage-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-care-ink">Retry settings</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Retry attempts">
              <TextInput
                type="number"
                value={settings.retryAttempts}
                min={0}
                max={5}
                onChange={(event) => updateField("retryAttempts", Number(event.target.value))}
              />
            </Field>
            <Field label="Gap between retries">
              <TextInput
                type="number"
                value={settings.retryGapMinutes}
                min={5}
                onChange={(event) => updateField("retryGapMinutes", Number(event.target.value))}
              />
            </Field>
          </div>
        </Card>
      </section>

      <div>
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </>
  );
}
