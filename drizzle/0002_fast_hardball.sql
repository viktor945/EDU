CREATE TABLE `display_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`profile_id` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `display_profiles`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_display_devices_school` ON `display_devices` (`school_id`);--> statement-breakpoint
CREATE INDEX `idx_display_devices_profile` ON `display_devices` (`profile_id`);--> statement-breakpoint
CREATE TABLE `display_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`sections` text NOT NULL,
	`start_section` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_display_profiles_school` ON `display_profiles` (`school_id`);