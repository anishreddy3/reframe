CREATE TABLE `checkins` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`checkin_date` text NOT NULL,
	`urges` integer NOT NULL,
	`slipups` integer NOT NULL,
	`mood` integer NOT NULL,
	`triggers_json` text NOT NULL,
	`context` text NOT NULL,
	`time_of_day` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`session_id` text PRIMARY KEY NOT NULL,
	`habit_description` text NOT NULL,
	`severity` text NOT NULL,
	`goal` text NOT NULL,
	`habit_type` text NOT NULL,
	`starting_plan` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
