ALTER TABLE `instagram_connections` ADD `client_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `instagram_connections_client_id_unique` ON `instagram_connections` (`client_id`);--> statement-breakpoint
ALTER TABLE `instagram_states` ADD `client_id` text;