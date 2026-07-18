import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  sessionId: text("session_id").primaryKey(),
  habitDescription: text("habit_description").notNull(),
  severity: text("severity").notNull(),
  goal: text("goal").notNull(),
  habitType: text("habit_type").notNull(),
  startingPlan: text("starting_plan").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const checkins = sqliteTable("checkins", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  checkinDate: text("checkin_date").notNull(),
  urges: integer("urges").notNull(),
  slipups: integer("slipups").notNull(),
  mood: integer("mood").notNull(),
  triggersJson: text("triggers_json").notNull(),
  context: text("context").notNull(),
  timeOfDay: text("time_of_day").notNull(),
  createdAt: text("created_at").notNull(),
});
