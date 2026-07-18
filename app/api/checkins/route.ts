import { getProfile, listCheckins, saveCheckin } from "../../../db/repository";
import { authenticationRequiredResponse, getAuthenticatedOwner } from "../../../lib/authenticated-user";
import { serviceError } from "../../../lib/http";
import { calculateProgress } from "../../../lib/progress";
import { checkinForClient } from "../../../lib/public-data";
import type { StoredCheckin } from "../../../lib/types";
import { cleanText, integerInRange } from "../../../lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const identity = await getAuthenticatedOwner();
    if (!identity) return authenticationRequiredResponse();
    const storedCheckins = await listCheckins(identity.ownerId, 30);
    return Response.json(
      { checkins: storedCheckins.map(checkinForClient), stats: calculateProgress(storedCheckins) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: serviceError(error, "Check-ins") }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const identity = await getAuthenticatedOwner();
    if (!identity) return authenticationRequiredResponse();
    if (!(await getProfile(identity.ownerId))) throw new Error("Complete onboarding before checking in.");
    const date = cleanText(body.checkinDate, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a valid date.");
    const rawTriggers = Array.isArray(body.triggers) ? body.triggers : String(body.triggers ?? "").split(",");
    const triggers = rawTriggers.map((trigger) => cleanText(trigger, 50).toLowerCase()).filter(Boolean).slice(0, 8);
    const timeOfDay = cleanText(body.timeOfDay, 20) as StoredCheckin["timeOfDay"];
    if (!(["morning", "afternoon", "evening", "late-night"] as string[]).includes(timeOfDay)) throw new Error("Choose a valid time of day.");
    const checkin: StoredCheckin = {
      id: crypto.randomUUID(),
      ownerId: identity.ownerId,
      checkinDate: date,
      urges: integerInRange(body.urges, 0, 100, "Urges"),
      slipups: integerInRange(body.slipups, 0, 100, "Slip-ups"),
      mood: integerInRange(body.mood, 1, 5, "Mood"),
      triggers,
      context: cleanText(body.context, 500),
      timeOfDay,
      createdAt: new Date().toISOString(),
    };
    await saveCheckin(checkin);
    const checkins = await listCheckins(identity.ownerId, 30);
    return Response.json(
      {
        checkin: checkinForClient(checkin),
        checkins: checkins.map(checkinForClient),
        stats: calculateProgress(checkins),
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json({ error: serviceError(error, "Check-in") }, { status: 400 });
  }
}
