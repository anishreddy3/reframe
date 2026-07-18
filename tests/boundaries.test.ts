import assert from "node:assert/strict";
import test from "node:test";
import { checkSafety } from "../lib/crisis.ts";
import { readJsonResponse } from "../lib/client-http.ts";
import { checkinForClient, profileForClient } from "../lib/public-data.ts";
import { parseResearchResults } from "../lib/research.ts";
import type { StoredCheckin, StoredProfile } from "../lib/types.ts";
import { cleanText, integerInRange, safeExternalUrl } from "../lib/validation.ts";

test("client JSON handling preserves server errors and rejects malformed bodies", async () => {
  const success = await readJsonResponse<{ value: number }>(
    new Response(JSON.stringify({ value: 42 }), { status: 200 }),
    "Request failed.",
  );
  assert.equal(success.value, 42);

  await assert.rejects(
    readJsonResponse(
      new Response(JSON.stringify({ error: "Specific server error" }), { status: 400 }),
      "Request failed.",
    ),
    /Specific server error/,
  );
  await assert.rejects(
    readJsonResponse(new Response("not-json", { status: 200 }), "Request failed."),
    /invalid response/,
  );
});

test("input validation normalizes text and rejects unsafe values", () => {
  assert.equal(cleanText("  hello\u0000   world  ", 50), "hello world");
  assert.equal(cleanText("abcdef", 3), "abc");
  assert.equal(integerInRange("4", 0, 5, "Mood"), 4);
  assert.throws(() => integerInRange(2.5, 0, 5, "Mood"), /between 0 and 5/);
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl("https://example.com/path"), "https://example.com/path");
});

test("Exa result parsing keeps genuine HTTP sources and sanitizes browser output", () => {
  const results = parseResearchResults([
    {
      title: "  Evidence\u0000 source  ",
      url: "https://example.com/paper",
      highlights: [" First   finding. ", "Second finding."],
      publishedDate: "2026-07-18T00:00:00.000Z",
    },
    { title: "Unsafe", url: "javascript:alert(1)", highlights: ["discard me"] },
    { title: "", url: "https://health.example.org/article", highlights: null },
  ]);

  assert.equal(results.length, 2);
  assert.deepEqual(results[0], {
    title: "Evidence source",
    url: "https://example.com/paper",
    snippet: "First finding. Second finding.",
    publishedDate: "2026-07-18T00:00:00.000Z",
  });
  assert.equal(results[1].title, "health.example.org");
  assert.equal(results[1].snippet, "");
});

test("API presentation helpers never expose internal owner identifiers", () => {
  const profile: StoredProfile = {
    ownerId: "usr_private",
    habitDescription: "A sufficiently detailed synthetic habit description.",
    severity: "moderate",
    goal: "reduce",
    habitType: "screen checking",
    startingPlan: "A generated plan.",
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
  };
  const checkin: StoredCheckin = {
    ownerId: "usr_private",
    id: "entry-1",
    checkinDate: "2026-07-18",
    urges: 2,
    slipups: 0,
    mood: 4,
    triggers: ["stress"],
    context: "Synthetic context.",
    timeOfDay: "afternoon",
    createdAt: "2026-07-18T12:00:00.000Z",
  };

  assert.equal("ownerId" in profileForClient(profile), false);
  assert.equal("ownerId" in checkinForClient(checkin), false);
});

test("deterministic crisis phrases escalate before ordinary AI coaching", async () => {
  assert.deepEqual(await checkSafety("I want to hurt myself"), {
    escalate: true,
    reason: "keyword",
  });
});
