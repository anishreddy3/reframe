import OpenAI from "openai";
import type { Checkin, Profile } from "./types";

const COACH_PROMPT = `You are Reframe, a warm, non-judgmental behavior-change coach. You support users working on harmful habits using practical, evidence-aligned techniques such as implementation intentions, urge surfing, stimulus control, friction design, habit stacking, and compassionate relapse planning. Never diagnose, shame, moralize, or claim to replace professional care. Treat setbacks as information. Use only the user's supplied details and history; never invent patterns. If the input suggests crisis, self-harm, dangerous withdrawal, or severe substance dependence, do not coach—recommend immediate professional human support.`;

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured on the server.");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function createStartingPlan(input: {
  habitDescription: string;
  severity: Profile["severity"];
  goal: Profile["goal"];
}) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const completion = await client().chat.completions.create({
    model,
    messages: [
      { role: "system", content: COACH_PROMPT },
      {
        role: "user",
        content: `Classify the habit and create a genuinely personalized, realistic starting plan. Return JSON with exactly two string fields: habitType (brief plain-language classification) and startingPlan (supportive plan with 3-5 concrete steps, including at least one implementation intention and one strategy for urges). User details: ${JSON.stringify(input)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 700,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty onboarding response.");
  const parsed = JSON.parse(content) as { habitType?: unknown; startingPlan?: unknown };
  if (typeof parsed.habitType !== "string" || typeof parsed.startingPlan !== "string") {
    throw new Error("OpenAI returned an invalid onboarding response.");
  }
  return { habitType: parsed.habitType.trim().slice(0, 120), startingPlan: parsed.startingPlan.trim(), model: completion.model || model };
}

export async function createCoachReply(message: string, profile: Profile, recentCheckins: Checkin[]) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const compactHistory = recentCheckins.slice(0, 10).map(({ checkinDate, urges, slipups, mood, triggers, context, timeOfDay }) => ({
    checkinDate,
    urges,
    slipups,
    mood,
    triggers,
    context,
    timeOfDay,
  }));
  const completion = await client().chat.completions.create({
    model,
    messages: [
      { role: "system", content: COACH_PROMPT },
      {
        role: "user",
        content: `Respond to the user's message with concise, adaptive coaching. Refer to repeated triggers only if the recent database history actually shows them. Profile: ${JSON.stringify({ habitType: profile.habitType, severity: profile.severity, goal: profile.goal })}. Recent check-ins from the database: ${JSON.stringify(compactHistory)}. User message: ${JSON.stringify(message)}`,
      },
    ],
    max_completion_tokens: 550,
  });
  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("OpenAI returned an empty coaching response.");
  return { reply, model: completion.model || model };
}
