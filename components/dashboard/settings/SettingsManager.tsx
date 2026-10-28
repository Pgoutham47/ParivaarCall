"use client";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  Languages,
  Loader2,
  MessageCircle,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { updateVoiceSettings } from "@/lib/services/settings";
import { createClient } from "@/lib/supabase/client";
import {
  selectableCallLanguages,
  type VoiceSettings,
  type VoiceSettingsInput,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const PARENT_PREFERRED = "Parent preferred language";
const languageNames: Record<string, string> = {
  Telugu: "తెలుగు",
  English: "English",
  Hindi: "हिन्दी",
  Tamil: "தமிழ்",
  Kannada: "ಕನ್ನಡ",
};

function editableSettings(settings: VoiceSettings | null): VoiceSettingsInput {
  return {
    languagePreference: settings?.languagePreference ?? PARENT_PREFERRED,
    respectMode: settings?.respectMode ?? "formal",
    retryAttempts: settings?.retryAttempts ?? 2,
    retryGapMinutes: settings?.retryGapMinutes ?? 10,
  };
}

export function SettingsManager({
  initialSettings,
  initialError,
}: {
  initialSettings: VoiceSettings | null;
  initialError?: string;
}) {
  const [settings, setSettings] = useState(() =>
    editableSettings(initialSettings),
  );
  const [savedSettings, setSavedSettings] = useState(() =>
    editableSettings(initialSettings),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const useParentLanguage = settings.languagePreference === PARENT_PREFERRED;

  useEffect(() => {
    if (!hasChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasChanges]);

  function updateField<Key extends keyof VoiceSettingsInput>(
    field: Key,
    value: VoiceSettingsInput[Key],
  ) {
    setSettings((current) => ({ ...current, [field]: value }));
    setSavedMessage(null);
    setError(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !hasChanges) return;
    setIsSaving(true);
    setSavedMessage(null);
    setError(null);
    try {
      const saved = editableSettings(
        await updateVoiceSettings(createClient(), settings),
      );
      setSettings(saved);
      setSavedSettings(saved);
      setSavedMessage(
        "Preferences saved. Your language and speaking style will be used on the next call.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn’t save your preferences. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!initialSettings) {
    return (
      <Card className="py-10 text-center">
        <RefreshCw
          className="mx-auto mb-4 h-6 w-6 text-sage-500"
          aria-hidden="true"
        />
        <h2 className="section-title">We couldn’t load your preferences</h2>
        <p
          className="mx-auto mt-2 max-w-md text-sm leading-6 text-sage-600"
          role="alert"
        >
          {initialError ??
            "Please reload this page to try again. Your saved preferences have not changed."}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-5"
          onClick={() => window.location.reload()}
        >
          Reload preferences
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5" aria-busy={isSaving}>
      <fieldset disabled={isSaving} className="space-y-5">
        <legend className="sr-only">Call preferences</legend>

        <Card className="!p-0">
          <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[220px_1fr] xl:gap-10">
            <div>
              <Languages
                className="mb-4 h-5 w-5 text-sage-600"
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <h2 className="section-title">A familiar language</h2>
              <p className="mt-2 text-sm leading-6 text-sage-600">
                Choose how every reminder begins.
              </p>
            </div>
            <fieldset className="min-w-0">
              <legend className="sr-only">Default call language</legend>
              <label
                className={cn(
                  "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sage-600 flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition",
                  useParentLanguage
                    ? "border-sage-600 bg-sage-50"
                    : "border-sage-200 hover:border-sage-400",
                )}
              >
                <span>
                  <span className="block text-sm font-semibold text-care-ink">
                    Use each parent’s language
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-sage-600">
                    The language saved on their family profile.
                  </span>
                </span>
                <input
                  type="radio"
                  name="languagePreference"
                  value={PARENT_PREFERRED}
                  checked={useParentLanguage}
                  onChange={() =>
                    updateField("languagePreference", PARENT_PREFERRED)
                  }
                  className="h-4 w-4 shrink-0 border-sage-300 text-sage-700 focus:ring-sage-500"
                />
              </label>
              <p className="mb-3 mt-5 text-xs font-medium text-sage-600">
                Or choose one language for everyone
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {selectableCallLanguages.map((language) => {
                  const selected = settings.languagePreference === language;
                  return (
                    <label
                      key={language}
                      className={cn(
                        "relative flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-3.5 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sage-600",
                        selected
                          ? "border-sage-600 bg-sage-50"
                          : "border-sage-200 hover:border-sage-400",
                      )}
                    >
                      <input
                        type="radio"
                        name="languagePreference"
                        value={language}
                        checked={selected}
                        onChange={() =>
                          updateField("languagePreference", language)
                        }
                        className="sr-only"
                      />
                      <span
                        className="text-base leading-6 text-care-ink"
                        lang={
                          {
                            Telugu: "te",
                            Hindi: "hi",
                            Tamil: "ta",
                            Kannada: "kn",
                            English: "en",
                          }[language]
                        }
                      >
                        {languageNames[language]}
                      </span>
                      <span className="text-xs font-medium text-sage-600">
                        {language}
                      </span>
                      {selected ? (
                        <Check
                          className="absolute right-2 top-2 h-3 w-3 text-sage-700"
                          aria-hidden="true"
                        />
                      ) : null}
                    </label>
                  );
                })}
              </div>
              {!useParentLanguage &&
              !selectableCallLanguages.includes(
                settings.languagePreference as never,
              ) ? (
                <p className="notice-error mt-4">
                  The saved language “{settings.languagePreference}” is no
                  longer available. Choose a supported language before saving.
                </p>
              ) : null}
              <p className="mt-4 text-xs leading-5 text-sage-600">
                Your parent can ask to switch between these five languages
                during a call.
              </p>
            </fieldset>
          </div>
        </Card>

        <Card className="!p-0">
          <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[220px_1fr] xl:gap-10">
            <div>
              <MessageCircle
                className="mb-4 h-5 w-5 text-sage-600"
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <h2 className="section-title">The right tone</h2>
              <p className="mt-2 text-sm leading-6 text-sage-600">
                A greeting that feels comfortable for your family.
              </p>
            </div>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Speaking style</legend>
              {[
                {
                  value: "formal" as const,
                  title: "Polite & respectful",
                  copy: "Uses their name with a formal greeting.",
                  label: "Formal",
                },
                {
                  value: "casual" as const,
                  title: "Warm & familiar",
                  copy: "Uses their family relationship, like Amma or Nanna.",
                  label: "Familiar",
                },
              ].map((style) => (
                <label
                  key={style.value}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-xl border p-4 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sage-600",
                    settings.respectMode === style.value
                      ? "border-sage-600 bg-sage-50"
                      : "border-sage-200 hover:border-sage-400",
                  )}
                >
                  <span className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-sage-600">
                      {style.label}
                    </span>
                    <input
                      type="radio"
                      name="respectMode"
                      value={style.value}
                      checked={settings.respectMode === style.value}
                      onChange={() => updateField("respectMode", style.value)}
                      className="h-4 w-4 border-sage-300 text-sage-700 focus:ring-sage-500"
                    />
                  </span>
                  <span className="text-sm font-semibold text-care-ink">
                    {style.title}
                  </span>
                  <span className="mt-2 text-xs leading-5 text-sage-600">
                    {style.copy}
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
        </Card>

        <Card className="!p-0">
          <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[220px_1fr] xl:gap-10">
            <div>
              <RotateCcw
                className="mb-4 h-5 w-5 text-sage-600"
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <h2 className="section-title">A gentle follow-up</h2>
              <p className="mt-2 text-sm leading-6 text-sage-600">
                For missed calls or when your parent asks to be reminded later.
              </p>
            </div>
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Extra call attempts">
                  <SelectInput
                    name="retryAttempts"
                    value={settings.retryAttempts}
                    onChange={(event) =>
                      updateField("retryAttempts", Number(event.target.value))
                    }
                  >
                    {[0, 1, 2, 3, 4, 5].map((attempts) => (
                      <option key={attempts} value={attempts}>
                        {attempts === 0
                          ? "No follow-up calls"
                          : `${attempts} ${attempts === 1 ? "attempt" : "attempts"}`}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Time between attempts">
                  <div className="relative">
                    <TextInput
                      name="retryGapMinutes"
                      type="number"
                      min={5}
                      max={120}
                      step={1}
                      required
                      disabled={settings.retryAttempts === 0}
                      value={settings.retryGapMinutes}
                      onChange={(event) =>
                        updateField(
                          "retryGapMinutes",
                          Number(event.target.value),
                        )
                      }
                      className="pr-20"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-8 flex items-center text-xs text-sage-600">
                      minutes
                    </span>
                  </div>
                </Field>
              </div>
              <p className="mt-4 rounded-lg bg-sage-50 px-4 py-3 text-xs leading-5 text-sage-700">
                {settings.retryAttempts === 0
                  ? "Follow-up calls are turned off. Each reminder will call once."
                  : `After an unanswered call or a request to call later, we’ll try up to ${settings.retryAttempts} more ${settings.retryAttempts === 1 ? "time" : "times"}, ${settings.retryGapMinutes} minutes apart.`}
              </p>
              <details className="group mt-4 text-xs leading-5 text-sage-600">
                <summary className="focus-ring flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm font-medium text-sage-700 [&::-webkit-details-marker]:hidden">
                  How follow-ups work{" "}
                  <ChevronDown
                    className="h-3.5 w-3.5 transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-2 max-w-xl">
                  Follow-ups stop at the end of the reminder day. The time gap
                  applies to newly scheduled follow-ups. One-time test calls
                  never retry, and calls already in progress keep their current
                  settings.
                </p>
              </details>
            </div>
          </div>
        </Card>
      </fieldset>

      {error ? (
        <p role="alert" className="notice-error">
          {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p role="status" className="notice-success flex items-start gap-2">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          {savedMessage}
        </p>
      ) : null}

      <div className="sticky bottom-24 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-5 lg:bottom-5">
        <p
          className="flex items-center gap-2 text-xs text-sage-600"
          aria-live="polite"
        >
          {hasChanges ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-600"
              aria-hidden="true"
            />
          ) : (
            <Check className="h-3.5 w-3.5 text-sage-600" aria-hidden="true" />
          )}
          {hasChanges
            ? "You have unsaved changes"
            : "Your preferences are up to date"}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {hasChanges ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSettings({ ...savedSettings });
                setError(null);
                setSavedMessage(null);
              }}
              disabled={isSaving}
            >
              Discard
            </Button>
          ) : null}
          <Button
            type="submit"
            disabled={isSaving || !hasChanges}
            icon={
              isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : undefined
            }
          >
            {isSaving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </div>
    </form>
  );
}
