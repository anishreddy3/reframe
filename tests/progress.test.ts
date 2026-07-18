import assert from "node:assert/strict";
import test from "node:test";
import { calculateProgress, calculateStreak } from "../lib/progress.ts";
import type { Checkin } from "../lib/types.ts";

const makeCheckin = (date: string, urges: number, triggers: string[] = []): Checkin => ({
  id: date,
  sessionId: "session_123456789",
  checkinDate: date,
  urges,
  slipups: 0,
  mood: 3,
  triggers,
  context: "",
  timeOfDay: "evening",
  createdAt: `${date}T18:00:00.000Z`,
});

test("streak counts consecutive stored days and tolerates a missing today", () => {
  const entries = [makeCheckin("2026-07-17", 2), makeCheckin("2026-07-16", 3), makeCheckin("2026-07-15", 4)];
  assert.equal(calculateStreak(entries, new Date("2026-07-18T12:00:00Z")), 3);
});

test("progress uses actual urge and trigger values", () => {
  const stats = calculateProgress([
    makeCheckin("2026-07-14", 8, ["stress"]),
    makeCheckin("2026-07-15", 7, ["stress", "bedtime"]),
    makeCheckin("2026-07-16", 3, ["bedtime"]),
    makeCheckin("2026-07-17", 2, ["stress"]),
  ], new Date("2026-07-18T12:00:00Z"));
  assert.equal(stats.averageUrges, 5);
  assert.equal(stats.urgeTrend, "improving");
  assert.deepEqual(stats.topTriggers[0], { trigger: "stress", count: 3 });
});
