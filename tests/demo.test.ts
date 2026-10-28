import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";
import { DEMO_ACCOUNT_ID, isPresentationDemo } from "../lib/demo-account";
import { canCallNumber } from "../lib/calling-access";
import {
  createAlertFromCallResult,
  finalizeCallResult,
  findCallLogByProviderCallId,
  generateCallLogForSchedule,
  generateTodayCallLogs,
  getPendingCalls,
  getStuckCallingLogs,
  processPendingCall,
} from "../lib/services/call-engine";
import { localDateKey } from "../lib/services/timezone";

type Row = Record<string, unknown>;

// A small in-memory query fixture. Reads behave like the engine's database
// queries; any actual insert, matched update, or call claim fails the test.
function readOnlyClient(tables: Record<string, Row[]>) {
  const effects = { writes: 0, claims: 0, reads: 0 };
  const client = {
    from(table: string) {
      const predicates: Array<(row: Row) => boolean> = [];
      let rowLimit = Infinity;
      let orderBy: string | undefined;
      let updating = false;
      function execute() {
        effects.reads += 1;
        let rows = (tables[table] ?? []).filter((row) =>
          predicates.every((predicate) => predicate(row)),
        );
        if (orderBy)
          rows = [...rows].sort((left, right) =>
            String(left[orderBy!]).localeCompare(String(right[orderBy!])),
          );
        rows = rows.slice(0, rowLimit);
        if (updating && rows.length) {
          effects.writes += 1;
          throw new Error("Unexpected database update.");
        }
        return { data: rows, error: null };
      }
      return {
        select() {
          return this;
        },
        eq(key: string, value: unknown) {
          predicates.push((row) => row[key] === value);
          return this;
        },
        neq(key: string, value: unknown) {
          predicates.push((row) => row[key] !== value);
          return this;
        },
        lte(key: string, value: string) {
          predicates.push((row) => String(row[key]) <= value);
          return this;
        },
        lt(key: string, value: string) {
          predicates.push((row) => String(row[key]) < value);
          return this;
        },
        in(key: string, values: unknown[]) {
          predicates.push((row) => values.includes(row[key]));
          return this;
        },
        order(key: string) {
          orderBy = key;
          return this;
        },
        limit(value: number) {
          rowLimit = value;
          return this;
        },
        update() {
          updating = true;
          return this;
        },
        insert() {
          effects.writes += 1;
          throw new Error("Unexpected database insert.");
        },
        async maybeSingle() {
          const result = execute();
          return { data: result.data[0] ?? null, error: null };
        },
        async single() {
          const result = execute();
          return { data: result.data[0] ?? null, error: null };
        },
        then(
          resolve: (value: { data: Row[]; error: null }) => unknown,
          reject?: (error: unknown) => unknown,
        ) {
          return Promise.resolve().then(execute).then(resolve, reject);
        },
      };
    },
    async rpc() {
      effects.claims += 1;
      throw new Error("Unexpected call claim.");
    },
  } as unknown as SupabaseClient<Database>;
  return { client, effects };
}

const demoSchedule = {
  id: "demo-schedule",
  caregiver_id: DEMO_ACCOUNT_ID,
  parent_id: "demo-parent",
  is_active: true,
  frequency: "daily",
  start_date: localDateKey(),
  end_date: null,
  scheduled_time: "23:59:00",
  medicine_name: "Fictional reminder",
  dosage_instruction: null,
  food_timing: "after_food",
  parents: {
    status: "active",
    name: "Sample parent",
    relationship: "Mother",
    language: "English",
  },
};

function demoCall(overrides: Row = {}) {
  return {
    id: "demo-call",
    caregiver_id: DEMO_ACCOUNT_ID,
    parent_id: "demo-parent",
    medicine_schedule_id: demoSchedule.id,
    call_status: "pending",
    scheduled_for: "2020-01-01T00:00:00Z",
    call_started_at: "2020-01-01T00:00:00Z",
    provider_call_id: "fictional-execution",
    ...overrides,
  };
}

test("the presentation account cannot call, even on a paid plan or with a verified number", () => {
  const previous = {
    FREE_TIER_CALLING: process.env.FREE_TIER_CALLING,
    VERIFIED_CALL_NUMBERS: process.env.VERIFIED_CALL_NUMBERS,
    CALL_PROVIDER: process.env.CALL_PROVIDER,
  };
  try {
    const phone = "+12025550123";
    process.env.CALL_PROVIDER = "bolna";
    process.env.VERIFIED_CALL_NUMBERS = JSON.stringify({
      [DEMO_ACCOUNT_ID]: [phone],
      regular: [phone],
    });
    for (const flag of ["true", "false"]) {
      process.env.FREE_TIER_CALLING = flag;
      assert.equal(canCallNumber(phone, DEMO_ACCOUNT_ID), false);
      assert.equal(canCallNumber("+919876543210", DEMO_ACCOUNT_ID), false);
      assert.equal(canCallNumber(phone, "regular"), true);
    }
    assert.equal(isPresentationDemo(undefined), false);
    assert.equal(isPresentationDemo(null), false);
    assert.equal(isPresentationDemo("regular"), false);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("active demo schedules are skipped by both immediate and daily generation", async () => {
  const { client, effects } = readOnlyClient({
    medicine_schedules: [demoSchedule],
  });
  assert.deepEqual(await generateCallLogForSchedule(client, demoSchedule.id), {
    outcome: "ineligible",
  });
  const daily = await generateTodayCallLogs(client);
  assert.equal(daily.created, 0);
  assert.equal(daily.eligibleSchedules, 0);
  assert.deepEqual(daily.errors, []);
  assert.equal(effects.writes, 0);
  assert.equal(effects.claims, 0);
  assert.equal(demoSchedule.is_active, true);
});

test("demo history cannot fill worker or reconciliation batches or match provider callbacks", async () => {
  const samples = Array.from({ length: 30 }, (_, index) =>
    demoCall({ id: `demo-${index}` }),
  );
  const regular = demoCall({
    id: "regular-call",
    caregiver_id: "regular",
    scheduled_for: "2021-01-01T00:00:00Z",
  });
  const pending = readOnlyClient({ call_logs: [...samples, regular] });
  assert.deepEqual(
    (await getPendingCalls(pending.client)).map((row) => row.id),
    [regular.id],
  );
  assert.equal(
    await findCallLogByProviderCallId(
      readOnlyClient({ call_logs: [demoCall()] }).client,
      "fictional-execution",
    ),
    null,
  );
  const calling = readOnlyClient({
    call_logs: [...samples, regular].map((row) => ({
      ...row,
      call_status: "calling",
    })),
  });
  assert.deepEqual(
    (await getStuckCallingLogs(calling.client, 10)).map((row) => row.id),
    [regular.id],
  );
  assert.equal(pending.effects.writes + calling.effects.writes, 0);
});

test("direct processing never claims a presentation call or reaches a provider", async () => {
  const { client, effects } = readOnlyClient({ call_logs: [demoCall()] });
  assert.equal(await processPendingCall(client, "demo-call"), null);
  assert.equal(effects.claims, 0);
  assert.equal(effects.writes, 0);
});

test("demo finalization and alert requests leave samples intact without retries or notifications", async () => {
  const { client, effects } = readOnlyClient({ call_logs: [demoCall()] });
  for (const status of [
    "no_answer",
    "snoozed",
    "need_help",
    "failed",
  ] as const) {
    assert.equal(
      await finalizeCallResult(client, "demo-call", {
        status,
        responseType: "no_response",
      }),
      null,
    );
  }
  assert.equal(
    await createAlertFromCallResult(
      client,
      demoCall({ call_status: "need_help" }) as unknown as Parameters<
        typeof createAlertFromCallResult
      >[1],
    ),
    null,
  );
  assert.equal(effects.writes, 0);
  assert.equal(effects.claims, 0);
});
