import type { Checkin, Profile, StoredCheckin, StoredProfile } from "./types.ts";

export function profileForClient(profile: StoredProfile): Profile {
  return {
    habitDescription: profile.habitDescription,
    severity: profile.severity,
    goal: profile.goal,
    habitType: profile.habitType,
    startingPlan: profile.startingPlan,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function checkinForClient(checkin: StoredCheckin): Checkin {
  return {
    id: checkin.id,
    checkinDate: checkin.checkinDate,
    urges: checkin.urges,
    slipups: checkin.slipups,
    mood: checkin.mood,
    triggers: checkin.triggers,
    context: checkin.context,
    timeOfDay: checkin.timeOfDay,
    createdAt: checkin.createdAt,
  };
}
