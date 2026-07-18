import { env } from "cloudflare:workers";
import type { Checkin, Profile } from "../lib/types";
import { getProfileFromDb, listCheckinsFromDb, saveCheckinToDb, saveProfileToDb } from "./core";

function database(): D1Database {
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding) throw new Error("The Reframe database is unavailable.");
  return binding;
}

export function getProfile(sessionId: string): Promise<Profile | null> {
  return getProfileFromDb(database(), sessionId);
}

export function saveProfile(profile: Profile): Promise<Profile> {
  return saveProfileToDb(database(), profile);
}

export function saveCheckin(checkin: Checkin): Promise<Checkin> {
  return saveCheckinToDb(database(), checkin);
}

export function listCheckins(sessionId: string, limit = 30): Promise<Checkin[]> {
  return listCheckinsFromDb(database(), sessionId, limit);
}
