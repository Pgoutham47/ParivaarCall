import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";
import { normalizePhoneNumber } from "../lib/phone";
import { isExecutionInProgress, toCallResult } from "../lib/call-providers/bolna-results";
import { getAdherenceSummary } from "../lib/services/analytics";
import { listCallLogs, listAlerts } from "../lib/services/calls-alerts";

test("Indian local numbers and formatted international numbers are dialable", () => {
  for (const value of ["9876543210", "919876543210", "+91 98765 43210", "0091-98765-43210"]) {
    assert.equal(normalizePhoneNumber(value), "+919876543210");
  }
  assert.equal(normalizePhoneNumber("+1 (202) 555-0123"), "+12025550123");
});

test("missing, incomplete and ambiguous phone numbers are rejected before a call", () => {
  for (const value of ["", "12345", "call me", "+0000000000", "2025550123", "+919876543210 ext 4"]) {
    assert.throws(() => normalizePhoneNumber(value), /valid phone number/);
  }
});

test("disconnection waits for post-call extraction instead of closing the reminder", () => {
  for (const status of ["queued", "ringing", "in-progress", "call-disconnected", "call_disconnected"]) {
    assert.equal(isExecutionInProgress(status), true);
  }
  for (const status of ["completed", "failed", "no-answer", "busy"]) {
    assert.equal(isExecutionInProgress(status), false);
  }
  assert.equal(toCallResult({ status: "completed", extracted_data: { reminder_outcome: "taken" } }).status, "confirmed");
  assert.equal(toCallResult({ status: "completed", extracted_data: { reminder_outcome: "help" } }).status, "need_help");
});

test("analytics excludes future and old doses and collapses retries", async () => {
  const now = Date.now();
  const row = (days: number, status: string, medicine = "medicine-1") => ({
    scheduled_for: new Date(now - days * 86400000).toISOString(),
    call_status: status, medicine_schedule_id: medicine, parent_id: "parent-1",
    parents: { name: "Test parent" }, medicine_schedules: { medicine_name: "Test medicine" }
  });
  const rows = [row(1, "no_answer"), row(1, "confirmed"), row(2, "missed"), row(-1, "confirmed"), row(40, "confirmed")];
  let filtered = rows;
  const query = {
    select() { return this; },
    gte(_column: string, value: string) { filtered = filtered.filter(r => r.scheduled_for >= value); return this; },
    lte(_column: string, value: string) { filtered = filtered.filter(r => r.scheduled_for <= value); return this; },
    order() { return Promise.resolve({ data: filtered, error: null }); }
  };
  const client = { from: () => query } as unknown as SupabaseClient<Database>;
  const summary = await getAdherenceSummary(client);
  assert.equal(summary.totalDoses, 2);
  assert.equal(summary.confirmedDoses, 1);
  assert.equal(summary.adherence30, 50);
  assert.equal(summary.adherence7, 50);
});

test("category extractions use the reminder outcome, including explicit no response", () => {
  assert.equal(toCallResult({ status: "completed", extracted_data: { Care: { reminder_outcome: { objective: "taken" } } } }).status, "confirmed");
  assert.equal(toCallResult({ status: "completed", extracted_data: { Care: { reminder_outcome: { objective: { value: "help" } } } } }).status, "need_help");
  assert.equal(toCallResult({ status: "completed", extracted_data: { Care: { reminder_outcome: { objective: "no_response" } } }, transcript: "user: I took it" }).status, "missed");
});

test("transcript fallback does not turn greetings, deferrals or negations into confirmations", () => {
  assert.equal(toCallResult({ status: "completed", transcript: "assistant: Have you taken medicine? user: yes, remind me later" }).status, "snoozed");
  for (const transcript of ["assistant: Did you take it? user: yes", "user: avunu", "user: I have not taken it", "assistant: I took it user: hello"]) {
    assert.equal(toCallResult({ status: "completed", transcript }).status, "missed");
  }
  assert.equal(toCallResult({ status: "completed", transcript: "user: మందు వేసుకున్నాను" }).status, "confirmed");
});

test("call and alert timestamps display India time even on UTC deployments", async () => {
  const row = { id: "test", scheduled_for: "2026-10-28T15:55:00Z", created_at: "2026-10-28T15:55:00Z", script_language: "English", script_text: null, call_status: "confirmed", retry_count: 0 };
  const query = { select() { return this; }, order() { return Promise.resolve({ data: [row], error: null }); } };
  const client = { from: () => query } as unknown as SupabaseClient<Database>;
  const [call] = await listCallLogs(client);
  const [alert] = await listAlerts(client);
  assert.match(call.scheduledTime, /9:25\s*pm/i);
  assert.match(call.createdAt, /9:25\s*pm/i);
  assert.match(alert.createdAt, /9:25\s*pm/i);
});
