CREATE TABLE `instagram_publications` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`client_id` text NOT NULL,
	`account_id` text NOT NULL,
	`format` text NOT NULL,
	`media_kind` text NOT NULL,
	`media_url` text NOT NULL,
	`caption` text NOT NULL,
	`due_at` integer NOT NULL,
	`status` text NOT NULL,
	`container_id` text,
	`media_id` text,
	`error` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instagram_publications_task_id_unique` ON `instagram_publications` (`task_id`);