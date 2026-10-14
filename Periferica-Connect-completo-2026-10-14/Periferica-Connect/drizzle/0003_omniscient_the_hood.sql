CREATE TABLE `instagram_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`token_cipher` text NOT NULL,
	`expires_at` integer NOT NULL,
	`connected_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `instagram_states` (
	`state` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires_at` integer NOT NULL
);
