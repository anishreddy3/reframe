import assert from "node:assert/strict";
import test from "node:test";
import { deleteUserDataFromDb, listCheckinsFromDb, saveCheckinToDb, type D1Like } from "../db/core.ts";
import type { StoredCheckin } from "../lib/types.ts";

class FakeStatement {
  sql: string;
  values: unknown[] = [];
  rows: Record<string, unknown>[];
  constructor(sql: string, rows: Record<string, unknown>[]) { this.sql = sql; this.rows = rows; }
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    if (this.sql.startsWith("INSERT INTO checkins")) {
      const [id, session_id, checkin_date, urges, slipups, mood, triggers_json, context, time_of_day, created_at] = this.values;
      this.rows.push({ id, session_id, checkin_date, urges, slipups, mood, triggers_json, context, time_of_day, created_at });
    }
    if (this.sql.startsWith("DELETE FROM checkins")) {
      const [ownerId] = this.values;
      for (let index = this.rows.length - 1; index >= 0; index -= 1) {
        if (this.rows[index].session_id === ownerId) this.rows.splice(index, 1);
      }
    }
    return { success: true };
  }
  async all<T>() {
    if (!this.sql.startsWith("SELECT * FROM checkins")) return { results: [] as T[] };
    const [sessionId, limit] = this.values;
    return { results: this.rows.filter((row) => row.session_id === sessionId).slice(0, Number(limit)) as T[] };
  }
  async first<T>() { return null as T | null; }
}

class FakeDatabase {
  rows: Record<string, unknown>[] = [];
  prepare(sql: string) { return new FakeStatement(sql, this.rows); }
  async batch(statements: FakeStatement[]) { for (const statement of statements) await statement.run(); return []; }
}

test("check-in storage round-trips trigger data through the repository", async () => {
  const database = new FakeDatabase() as unknown as D1Like;
  const checkin: StoredCheckin = {
    id: "entry-1", ownerId: "usr_owner_one", checkinDate: "2026-07-18", urges: 4, slipups: 1,
    mood: 3, triggers: ["stress", "bedtime"], context: "After a long day", timeOfDay: "late-night",
    createdAt: "2026-07-18T20:00:00.000Z",
  };
  await saveCheckinToDb(database, checkin);
  const stored = await listCheckinsFromDb(database, checkin.ownerId, 10);
  assert.equal(stored.length, 1);
  assert.deepEqual(stored[0], checkin);
});

test("database reads and deletion stay scoped to the authenticated owner", async () => {
  const database = new FakeDatabase() as unknown as D1Like;
  const base: Omit<StoredCheckin, "id" | "ownerId"> = {
    checkinDate: "2026-07-18", urges: 2, slipups: 0, mood: 4, triggers: [], context: "",
    timeOfDay: "morning", createdAt: "2026-07-18T08:00:00.000Z",
  };
  await saveCheckinToDb(database, { ...base, id: "owner-a-entry", ownerId: "usr_owner_a" });
  await saveCheckinToDb(database, { ...base, id: "owner-b-entry", ownerId: "usr_owner_b" });

  assert.deepEqual((await listCheckinsFromDb(database, "usr_owner_a", 10)).map((entry) => entry.id), ["owner-a-entry"]);
  await deleteUserDataFromDb(database, "usr_owner_a");
  assert.equal((await listCheckinsFromDb(database, "usr_owner_a", 10)).length, 0);
  assert.deepEqual((await listCheckinsFromDb(database, "usr_owner_b", 10)).map((entry) => entry.id), ["owner-b-entry"]);
});
