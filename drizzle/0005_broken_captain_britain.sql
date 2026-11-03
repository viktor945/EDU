CREATE TABLE `translation_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`translated_text` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_translation_cache_school` ON `translation_cache` (`school_id`);--> statement-breakpoint
CREATE TABLE `translation_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`characters` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_translation_usage_date` ON `translation_usage` (`created_at`);