import { getProfile } from "../../../db/repository";
import { authenticationRequiredResponse, getAuthenticatedOwner } from "../../../lib/authenticated-user";
import { serviceError } from "../../../lib/http";
import { searchEvidence } from "../../../lib/research";
import { cleanText } from "../../../lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const identity = await getAuthenticatedOwner();
    if (!identity) return authenticationRequiredResponse();
    const question = cleanText(body.question, 500);
    if (question.length < 8) throw new Error("Describe the strategy you want to research.");
    const profile = await getProfile(identity.ownerId);
    if (!profile) throw new Error("Complete onboarding before searching for evidence.");
    const results = await searchEvidence(identity.ownerId, profile.habitType, question);
    return Response.json({ results, query: question, source: "Exa neural search" });
  } catch (error) {
    return Response.json({ error: serviceError(error, "Evidence search") }, { status: 500 });
  }
}
