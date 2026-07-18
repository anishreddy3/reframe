import { getProfile, saveProfile } from "../../../db/repository";
import { checkSafety, escalationPayload } from "../../../lib/crisis";
import { serviceError } from "../../../lib/http";
import { createStartingPlan } from "../../../lib/openai-coach";
import type { Profile } from "../../../lib/types";
import { cleanText, validateSessionId } from "../../../lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionId = validateSessionId(new URL(request.url).searchParams.get("sessionId"));
    return Response.json({ profile: await getProfile(sessionId) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: serviceError(error) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessionId = validateSessionId(body.sessionId);
    const habitDescription = cleanText(body.habitDescription, 700);
    const severity = cleanText(body.severity, 20) as Profile["severity"];
    const goal = cleanText(body.goal, 20) as Profile["goal"];
    if (habitDescription.length < 12) throw new Error("Please describe the habit in a little more detail.");
    if (!(["mild", "moderate", "high"] as string[]).includes(severity)) throw new Error("Select a valid frequency.");
    if (!(["reduce", "quit"] as string[]).includes(goal)) throw new Error("Select a valid goal.");

    const safety = await checkSafety(habitDescription);
    if (safety.escalate) return Response.json({ escalation: escalationPayload }, { status: 200 });

    const plan = await createStartingPlan({ habitDescription, severity, goal });
    const now = new Date().toISOString();
    const existing = await getProfile(sessionId);
    const profile: Profile = {
      sessionId,
      habitDescription,
      severity,
      goal,
      habitType: plan.habitType,
      startingPlan: plan.startingPlan,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await saveProfile(profile);
    return Response.json({ profile, model: plan.model });
  } catch (error) {
    return Response.json({ error: serviceError(error, "Onboarding") }, { status: 500 });
  }
}
