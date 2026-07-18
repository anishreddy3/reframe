const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

export function cleanText(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARACTERS, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function validateSessionId(value: unknown): string {
  const sessionId = cleanText(value, 80);
  if (!/^[a-zA-Z0-9_-]{12,80}$/.test(sessionId)) throw new Error("A valid session is required.");
  return sessionId;
}

export function integerInRange(value: unknown, min: number, max: number, label: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return number;
}

export function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
