CREATE TABLE `d1_file_chunks` (
	`object_key` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`data` blob NOT NULL,
	PRIMARY KEY(`object_key`, `chunk_index`),
	FOREIGN KEY (`object_key`) REFERENCES `d1_file_objects`(`object_key`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `d1_file_objects` (
	`object_key` text PRIMARY KEY NOT NULL,
	`size` integer NOT NULL,
	`content_type` text NOT NULL,
	`uploaded_at` text NOT NULL,
	`etag` text NOT NULL
);
