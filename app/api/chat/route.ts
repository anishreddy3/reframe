import { getProfile, listCheckins } from "../../../db/repository";
import { authenticationRequiredResponse, getAuthenticatedOwner } from "../../../lib/authenticated-user";
import { checkSafety, escalationPayload } from "../../../lib/crisis";
import { serviceError } from "../../../lib/http";
import { createCoachReply } from "../../../lib/openai-coach";
import { cleanText } from "../../../lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const identity = await getAuthenticatedOwner();
    if (!identity) return authenticationRequiredResponse();
    const message = cleanText(body.message, 1000);
    if (message.length < 2) throw new Error("Write a message for your coach.");
    const safety = await checkSafety(message);
    if (safety.escalate) return Response.json({ escalation: escalationPayload });
    const profile = await getProfile(identity.ownerId);
    if (!profile) throw new Error("Complete onboarding before using the coach.");
    const history = await listCheckins(identity.ownerId, 10);
    return Response.json(await createCoachReply(message, profile, history));
  } catch (error) {
    return Response.json({ error: serviceError(error, "Coach") }, { status: 500 });
  }
}
