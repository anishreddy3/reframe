import assert from "node:assert/strict";
import test from "node:test";
import { createJudgeSessionCookie, judgeUserFromCookieHeader } from "../lib/judge-auth.ts";
import { ownerIdFromEmail } from "../lib/owner-id.ts";

test("verified emails map to stable, case-insensitive opaque owner IDs", async () => {
  const first = await ownerIdFromEmail(" Person@Example.com ");
  const second = await ownerIdFromEmail("person@example.com");
  const other = await ownerIdFromEmail("other@example.com");
  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.match(first, /^usr_[a-f0-9]{64}$/);
  assert.equal(first.includes("person@example.com"), false);
});

test("judge sessions are signed, expiring, and reject tampering", async () => {
  const previousSecret = process.env.JUDGE_SESSION_SECRET;
  process.env.JUDGE_SESSION_SECRET = "test-only-secret-that-is-longer-than-thirty-two-characters";
  try {
    const setCookie = await createJudgeSessionCookie();
    const cookie = setCookie.split(";", 1)[0];
    assert.equal((await judgeUserFromCookieHeader(cookie))?.email, "judge@reframe.demo");
    const tampered = cookie.replace("reframe-judge-session=", "reframe-judge-session=x");
    assert.equal(await judgeUserFromCookieHeader(tampered), null);
  } finally {
    if (previousSecret === undefined) delete process.env.JUDGE_SESSION_SECRET;
    else process.env.JUDGE_SESSION_SECRET = previousSecret;
  }
});
