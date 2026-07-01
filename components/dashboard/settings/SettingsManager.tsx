"use client";

import { BellRing, Languages, RotateCcw, Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { updateVoiceSettings } from "@/lib/services/settings";
import { createClient } from "@/lib/supabase/client";
import type { RespectMode, SpeechSpeed, VoiceGender, VoiceSettings, VoiceSettingsInput, VoiceTone } from "@/lib/types";

export function SettingsManager({
  initialSettings,
  initialError
}: {
  initialSettings: VoiceSettings | null;
  initialError?: string;
}) {
  const [settings, setSettings] = useState<VoiceSettingsInput>(() => ({
    languagePreference: initialSettings?.languagePreference ?? "Telugu",
    voiceGender: initialSettings?.voiceGender ?? "female",
    tone: initialSettings?.tone ?? "warm",
    speechSpeed: initialSettings?.speechSpeed ?? "normal",
    respectMode: initialSettings?.respectMode ?? "formal",
    retryAttempts: initialSettings?.retryAttempts ?? 2,
    retryGapMinutes: initialSettings?.retryGapMinutes ?? 10,
    notifications: {
      whatsapp: initialSettings?.notifications.whatsapp ?? true,
      sms: initialSettings?.notifications.sms ?? false,
      email: initialSettings?.notifications.email ?? true
    }
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  function updateField<Key extends keyof VoiceSettingsInput>(field: Key, value: VoiceSettingsInput[Key]) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function updateNotification(field: keyof VoiceSettingsInput["notifications"], value: boolean) {
    setSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [field]: value
      }
    }));
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
        voiceGender: savedSettings.voiceGender,
        tone: savedSettings.tone,
        speechSpeed: savedSettings.speechSpeed,
        respectMode: savedSettings.respectMode,
        retryAttempts: savedSettings.retryAttempts,
        retryGapMinutes: savedSettings.retryGapMinutes,
        notifications: savedSettings.notifications
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
          <div className="mt-5">
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
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Volume2 className="h-6 w-6 text-sage-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-care-ink">Voice tone</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Voice gender">
              <SelectInput
                value={settings.voiceGender}
                onChange={(event) => updateField("voiceGender", event.target.value as VoiceGender)}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </SelectInput>
            </Field>
            <Field label="Tone">
              <SelectInput
                value={settings.tone}
                onChange={(event) => updateField("tone", event.target.value as VoiceTone)}
              >
                <option value="warm">Warm</option>
                <option value="calm">Calm</option>
                <option value="respectful">Respectful</option>
              </SelectInput>
            </Field>
            <Field label="Speech speed">
              <SelectInput
                value={settings.speechSpeed}
                onChange={(event) => updateField("speechSpeed", event.target.value as SpeechSpeed)}
              >
                <option value="normal">Normal</option>
                <option value="slow">Slow</option>
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

        <Card>
          <div className="flex items-center gap-3">
            <BellRing className="h-6 w-6 text-sage-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-care-ink">Notification preferences</h2>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["WhatsApp", "whatsapp", settings.notifications.whatsapp],
              ["SMS", "sms", settings.notifications.sms],
              ["Email", "email", settings.notifications.email]
            ].map(([label, key, enabled]) => (
              <label key={key as string} className="flex min-h-12 items-center justify-between rounded-lg border border-sage-100 bg-white px-3 py-2">
                <span className="font-semibold text-care-ink">{label as string}</span>
                <input
                  type="checkbox"
                  checked={enabled as boolean}
                  onChange={(event) => updateNotification(key as keyof VoiceSettingsInput["notifications"], event.target.checked)}
                  className="h-5 w-5 rounded border-sage-300 text-sage-700 focus:ring-sage-600"
                />
              </label>
            ))}
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
