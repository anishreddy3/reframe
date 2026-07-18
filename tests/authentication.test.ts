import assert from "node:assert/strict";
import test from "node:test";
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
