"use client";

import { useState } from "react";
import {
  ChevronDown,
  Headphones,
  Languages,
  Phone,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScriptPreviewButton } from "@/components/dashboard/calls/ScriptPreviewButton";
import { CallSimulationActions } from "@/components/dashboard/calls/CallSimulationActions";
import { callStatus } from "@/components/dashboard/calls/call-status";
import type { CallLog } from "@/lib/types";

export function CallHistoryList({ calls }: { calls: CallLog[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = calls.filter((call) => {
    const matchesSearch = `${call.parentName} ${call.medicine}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "confirmed"
        ? call.status === "confirmed"
        : filter === "upcoming"
          ? ["pending", "calling"].includes(call.status)
          : ["missed", "no_answer", "snoozed", "need_help", "failed"].includes(
              call.status,
            ));
    return matchesSearch && matchesFilter;
  });

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-sage-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <label className="relative block sm:w-72">
          <span className="sr-only">
            Search this page by parent or medicine
          </span>
          <Search
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-sage-400"
            aria-hidden="true"
          />
          <input
            className="focus-ring min-h-11 w-full rounded-lg border border-sage-200 bg-white pl-9 pr-3 text-sm placeholder:text-sage-500"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search parent or medicine"
          />
        </label>
        <label>
          <span className="sr-only">Filter this page by call outcome</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="focus-ring min-h-11 w-full rounded-lg border border-sage-200 bg-white pl-3 pr-9 text-sm text-sage-800 sm:w-auto"
          >
            <option value="all">All outcomes</option>
            <option value="confirmed">Confirmed</option>
            <option value="followup">Needs follow-up</option>
            <option value="upcoming">Scheduled & in progress</option>
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between border-b border-sage-100 bg-sage-50/50 px-5 py-3 text-xs text-sage-600 sm:px-6">
        <p aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "call" : "calls"} on this
          page
        </p>
        <p>Latest first</p>
      </div>
      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Search
            className="mx-auto h-6 w-6 text-sage-400"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-base font-semibold text-care-ink">
            No matching calls on this page
          </h2>
          <p className="mt-2 text-sm text-sage-600">
            Try a different name or outcome, or look through older results.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            icon={<X className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-sage-100">
          {filtered.map((call) => (
            <details key={call.id} className="group">
              <summary className="focus-ring flex cursor-pointer list-none items-start gap-3 px-5 py-5 transition hover:bg-sage-50/60 sm:items-center sm:px-6 [&::-webkit-details-marker]:hidden">
                <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-50 text-sage-600 sm:flex">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-care-ink">
                      {call.parentName}
                    </h2>
                    <p className="mt-1 break-words text-sm text-sage-600">
                      {call.medicine}
                    </p>
                    <p className="mt-2 text-xs text-sage-500">
                      {call.createdAt}
                      <span className="mx-2">·</span>
                      {call.scriptLanguage}
                      {call.audioUrl ? (
                        <span className="ml-3 inline-flex items-center gap-1 text-sage-700">
                          <Headphones className="h-3 w-3" aria-hidden="true" />
                          Audio available
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <StatusBadge {...callStatus[call.status]} />
                    <p className="mt-2 text-xs text-sage-500">
                      {call.retryCount > 0
                        ? `Retry ${call.retryCount}`
                        : "First attempt"}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className="ml-1 mt-0.5 h-4 w-4 shrink-0 text-sage-500 transition-transform group-open:rotate-180 sm:mt-0"
                  aria-hidden="true"
                />
                <span className="sr-only">Call details</span>
              </summary>
              <div className="border-t border-sage-100 bg-sage-50/40 px-5 py-5 sm:px-6 sm:pl-[76px]">
                <p className="text-sm leading-6 text-sage-800">
                  {call.response}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-sage-600">
                  <span>Scheduled for {call.scheduledTime}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                    {call.scriptLanguage}
                  </span>
                  <ScriptPreviewButton
                    parentName={call.parentName}
                    medicineName={call.medicine}
                    language={call.scriptLanguage}
                    scriptText={call.scriptText}
                    safetyNote={call.safetyNote}
                  />
                </div>
                {call.audioUrl ? (
                  <section className="mt-5">
                    <h3 className="eyebrow">CONVERSATION AUDIO</h3>
                    <audio
                      className="mt-3 h-11 w-full max-w-lg"
                      controls
                      preload="none"
                      onPlay={(event) => {
                        document.querySelectorAll("audio").forEach((player) => {
                          if (player !== event.currentTarget) player.pause();
                        });
                      }}
                      aria-label={`Conversation audio for ${call.parentName}`}
                    >
                      <source src={call.audioUrl} />
                      Your browser cannot play this audio.
                    </audio>
                  </section>
                ) : null}
                {call.transcript ? (
                  <section className="mt-5">
                    <h3 className="eyebrow">CONVERSATION</h3>
                    <p
                      className="mt-2 max-h-80 overflow-auto whitespace-pre-line rounded-xl border border-sage-100 bg-white p-4 text-sm leading-7 text-sage-800"
                      tabIndex={0}
                      aria-label={`Conversation with ${call.parentName}`}
                    >
                      {call.transcript}
                    </p>
                  </section>
                ) : null}
                {process.env.NODE_ENV !== "production" ? (
                  <CallSimulationActions callLogId={call.id} />
                ) : null}
              </div>
            </details>
          ))}
        </div>
      )}
    </Card>
  );
}
