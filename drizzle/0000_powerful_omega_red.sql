CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`manager` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`owner` text NOT NULL,
	`due` text NOT NULL,
	`priority` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`briefing` text NOT NULL,
	`copy` text NOT NULL,
	`history` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
