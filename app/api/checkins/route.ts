import { getProfile, listCheckins, saveCheckin } from "../../../db/repository";
import { serviceError } from "../../../lib/http";
import { calculateProgress } from "../../../lib/progress";
import type { Checkin } from "../../../lib/types";
import { cleanText, integerInRange, validateSessionId } from "../../../lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionId = validateSessionId(new URL(request.url).searchParams.get("sessionId"));
    const checkins = await listCheckins(sessionId, 30);
    return Response.json({ checkins, stats: calculateProgress(checkins) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: serviceError(error, "Check-ins") }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessionId = validateSessionId(body.sessionId);
    if (!(await getProfile(sessionId))) throw new Error("Complete onboarding before checking in.");
    const date = cleanText(body.checkinDate, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a valid date.");
    const rawTriggers = Array.isArray(body.triggers) ? body.triggers : String(body.triggers ?? "").split(",");
    const triggers = rawTriggers.map((trigger) => cleanText(trigger, 50).toLowerCase()).filter(Boolean).slice(0, 8);
    const timeOfDay = cleanText(body.timeOfDay, 20) as Checkin["timeOfDay"];
    if (!(["morning", "afternoon", "evening", "late-night"] as string[]).includes(timeOfDay)) throw new Error("Choose a valid time of day.");
    const checkin: Checkin = {
      id: crypto.randomUUID(),
      sessionId,
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
    const checkins = await listCheckins(sessionId, 30);
    return Response.json({ checkin, checkins, stats: calculateProgress(checkins) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: serviceError(error, "Check-in") }, { status: 400 });
  }
}
