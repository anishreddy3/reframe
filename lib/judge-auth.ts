const JUDGE_COOKIE = "reframe-judge-session";
const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

type JudgeSession = {
  email: string;
  displayName: string;
  expiresAt: number;
};

function configuredSecret(): string {
  const secret = process.env.JUDGE_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JUDGE_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

async function signingKey(secret = configuredSecret()): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function createJudgeSessionCookie(): Promise<string> {
  const payload: JudgeSession = {
    email: "judge@reframe.demo",
    displayName: "Reframe evaluator",
    expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000,
  };
  const encodedPayload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      await signingKey(),
      new TextEncoder().encode(encodedPayload),
    ),
  );
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${JUDGE_COOKIE}=${encodedPayload}.${encodeBase64Url(signature)}; Path=/; Max-Age=${SESSION_LIFETIME_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearJudgeSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${JUDGE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export async function judgeUserFromCookieHeader(
  cookieHeader: string | null,
): Promise<{ email: string; displayName: string } | null> {
  const rawCookie = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${JUDGE_COOKIE}=`))
    ?.slice(JUDGE_COOKIE.length + 1);
  if (!rawCookie) return null;
  const [encodedPayload, encodedSignature, extra] = rawCookie.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;

  try {
    const verified = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );
    if (!verified) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as JudgeSession;
    if (
      payload.email !== "judge@reframe.demo" ||
      typeof payload.displayName !== "string" ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) return null;
    return { email: payload.email, displayName: payload.displayName };
  } catch {
    return null;
  }
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function equalDigests(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([digest(left), digest(right)]);
  let difference = 0;
  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest[index] ^ rightDigest[index];
  }
  return difference === 0;
}

export async function validJudgeCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUsername = process.env.JUDGE_ACCESS_USERNAME;
  const expectedPassword = process.env.JUDGE_ACCESS_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  const [usernameMatches, passwordMatches] = await Promise.all([
    equalDigests(username, expectedUsername),
    equalDigests(password, expectedPassword),
  ]);
  return usernameMatches && passwordMatches;
}
