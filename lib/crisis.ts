import OpenAI from "openai";

const IMMEDIATE_RISK_PATTERNS = [
  /\b(kill|hurt|harm)\s+(myself|me)\b/i,
  /\b(suicid(?:e|al)|self[- ]?harm|end my life|don'?t want to live)\b/i,
  /\b(overdose|can'?t stop using|dangerous withdrawal)\b/i,
];

export type SafetyCheck = { escalate: boolean; reason: "keyword" | "moderation" | null };

export async function checkSafety(text: string): Promise<SafetyCheck> {
  if (IMMEDIATE_RISK_PATTERNS.some((pattern) => pattern.test(text))) return { escalate: true, reason: "keyword" };
  if (!process.env.OPENAI_API_KEY) return { escalate: false, reason: null };

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await client.moderations.create({ model: "omni-moderation-latest", input: text });
  const categories = result.results[0]?.categories;
  const selfHarm = Boolean(categories?.["self-harm"] || categories?.["self-harm/intent"] || categories?.["self-harm/instructions"]);
  return { escalate: selfHarm, reason: selfHarm ? "moderation" : null };
}

export const escalationPayload = {
  message: "This sounds like something that deserves immediate human support. Reframe won’t try to coach through a crisis or severe dependency. You are not being diagnosed, and you do not have to handle this alone.",
  resources: [
    { label: "Find a verified helpline in your country", url: "https://findahelpline.com/" },
    { label: "U.S.: call or text 988", url: "https://988lifeline.org/" },
  ],
};
