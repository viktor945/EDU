CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`section` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`visible` integer DEFAULT false NOT NULL,
	`publish_at` text,
	`expires_at` text,
	`file_id` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_content_school_section` ON `content_items` (`school_id`,`section`);--> statement-breakpoint
CREATE INDEX `idx_content_publication` ON `content_items` (`school_id`,`status`,`visible`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'documents' NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`uploaded_by` text DEFAULT 'Владелец платформы' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_files_school_category` ON `files` (`school_id`,`category`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_files_object_key` ON `files` (`object_key`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`role` text NOT NULL,
	`position` text DEFAULT '' NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_email_school` ON `members` (`email`,`school_id`);--> statement-breakpoint
CREATE INDEX `idx_members_school_id` ON `members` (`school_id`);--> statement-breakpoint
CREATE INDEX `idx_members_role` ON `members` (`role`);--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`bin` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`director` text DEFAULT '' NOT NULL,
	`students_count` integer DEFAULT 0 NOT NULL,
	`teachers_count` integer DEFAULT 0 NOT NULL,
	`languages` text DEFAULT 'RU,KZ' NOT NULL,
	`primary_color` text DEFAULT '#1e5a46' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_schools_status` ON `schools` (`status`);