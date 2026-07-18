import { env } from "cloudflare:workers";
import type { StoredCheckin, StoredProfile } from "../lib/types";
import { deleteUserDataFromDb, getProfileFromDb, listCheckinsFromDb, saveCheckinToDb, saveProfileToDb } from "./core";

function database(): D1Database {
  const binding = (env as unknown as { DB?: D1Database }).DB;
  if (!binding) throw new Error("The Reframe database is unavailable.");
  return binding;
}

export function getProfile(ownerId: string): Promise<StoredProfile | null> {
  return getProfileFromDb(database(), ownerId);
}

export function saveProfile(profile: StoredProfile): Promise<StoredProfile> {
  return saveProfileToDb(database(), profile);
}

export function saveCheckin(checkin: StoredCheckin): Promise<StoredCheckin> {
  return saveCheckinToDb(database(), checkin);
}

export function listCheckins(ownerId: string, limit = 30): Promise<StoredCheckin[]> {
  return listCheckinsFromDb(database(), ownerId, limit);
}

export function deleteUserData(ownerId: string): Promise<void> {
  return deleteUserDataFromDb(database(), ownerId);
}
