import type { StoredCheckin, StoredProfile } from "../lib/types";

export type D1Like = Pick<D1Database, "prepare" | "batch">;

// `session_id` is retained as the physical column name for migration
// compatibility; every value stored in it is now a server-derived owner ID.
const PROFILE_TABLE = `CREATE TABLE IF NOT EXISTS profiles (
  session_id TEXT PRIMARY KEY,
  habit_description TEXT NOT NULL,
  severity TEXT NOT NULL,
  goal TEXT NOT NULL,
  habit_type TEXT NOT NULL,
  starting_plan TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

const CHECKIN_TABLE = `CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,
  urges INTEGER NOT NULL,
  slipups INTEGER NOT NULL,
  mood INTEGER NOT NULL,
  triggers_json TEXT NOT NULL,
  context TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  created_at TEXT NOT NULL
)`;

const CHECKIN_INDEX =
  "CREATE INDEX IF NOT EXISTS checkins_session_date_idx ON checkins (session_id, checkin_date DESC)";

export async function ensureSchema(database: D1Like) {
  await database.batch([
    database.prepare(PROFILE_TABLE),
    database.prepare(CHECKIN_TABLE),
    database.prepare(CHECKIN_INDEX),
  ]);
}

export type ProfileRow = {
  session_id: string;
  habit_description: string;
  severity: StoredProfile["severity"];
  goal: StoredProfile["goal"];
  habit_type: string;
  starting_plan: string;
  created_at: string;
  updated_at: string;
};

export type CheckinRow = {
  id: string;
  session_id: string;
  checkin_date: string;
  urges: number;
  slipups: number;
  mood: number;
  triggers_json: string;
  context: string;
  time_of_day: StoredCheckin["timeOfDay"];
  created_at: string;
};

export function hydrateProfile(row: ProfileRow): StoredProfile {
  return {
    ownerId: row.session_id,
    habitDescription: row.habit_description,
    severity: row.severity,
    goal: row.goal,
    habitType: row.habit_type,
    startingPlan: row.starting_plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function hydrateCheckin(row: CheckinRow): StoredCheckin {
  let triggers: string[] = [];
  try {
    const parsed = JSON.parse(row.triggers_json);
    if (Array.isArray(parsed)) {
      triggers = parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    triggers = [];
  }

  return {
    id: row.id,
    ownerId: row.session_id,
    checkinDate: row.checkin_date,
    urges: row.urges,
    slipups: row.slipups,
    mood: row.mood,
    triggers,
    context: row.context,
    timeOfDay: row.time_of_day,
    createdAt: row.created_at,
  };
}

export async function getProfileFromDb(
  database: D1Like,
  ownerId: string,
): Promise<StoredProfile | null> {
  await ensureSchema(database);
  const row = await database
    .prepare("SELECT * FROM profiles WHERE session_id = ? LIMIT 1")
    .bind(ownerId)
    .first<ProfileRow>();
  return row ? hydrateProfile(row) : null;
}

export async function saveProfileToDb(
  database: D1Like,
  profile: StoredProfile,
): Promise<StoredProfile> {
  await ensureSchema(database);
  await database
    .prepare(`INSERT INTO profiles (
      session_id, habit_description, severity, goal, habit_type,
      starting_plan, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET
      habit_description = excluded.habit_description,
      severity = excluded.severity,
      goal = excluded.goal,
      habit_type = excluded.habit_type,
      starting_plan = excluded.starting_plan,
      updated_at = excluded.updated_at`)
    .bind(
      profile.ownerId,
      profile.habitDescription,
      profile.severity,
      profile.goal,
      profile.habitType,
      profile.startingPlan,
      profile.createdAt,
      profile.updatedAt,
    )
    .run();
  return profile;
}

export async function saveCheckinToDb(
  database: D1Like,
  checkin: StoredCheckin,
): Promise<StoredCheckin> {
  await ensureSchema(database);
  await database
    .prepare(`INSERT INTO checkins (
      id, session_id, checkin_date, urges, slipups, mood,
      triggers_json, context, time_of_day, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      checkin.id,
      checkin.ownerId,
      checkin.checkinDate,
      checkin.urges,
      checkin.slipups,
      checkin.mood,
      JSON.stringify(checkin.triggers),
      checkin.context,
      checkin.timeOfDay,
      checkin.createdAt,
    )
    .run();
  return checkin;
}

export async function listCheckinsFromDb(
  database: D1Like,
  ownerId: string,
  limit = 30,
): Promise<StoredCheckin[]> {
  await ensureSchema(database);
  const result = await database
    .prepare(`SELECT * FROM checkins
      WHERE session_id = ?
      ORDER BY checkin_date DESC, created_at DESC
      LIMIT ?`)
    .bind(ownerId, limit)
    .all<CheckinRow>();
  return (result.results ?? []).map(hydrateCheckin);
}

export async function deleteUserDataFromDb(
  database: D1Like,
  ownerId: string,
): Promise<void> {
  await ensureSchema(database);
  await database.batch([
    database.prepare("DELETE FROM checkins WHERE session_id = ?").bind(ownerId),
    database.prepare("DELETE FROM profiles WHERE session_id = ?").bind(ownerId),
  ]);
}
