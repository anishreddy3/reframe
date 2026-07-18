/** Produces a deterministic, opaque database owner key from a verified email. */
export async function ownerIdFromEmail(email: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizedEmail),
  );
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `usr_${hex}`;
}
