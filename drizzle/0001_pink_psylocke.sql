CREATE TABLE `workshop_style_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`prompt` text NOT NULL,
	`category` text,
	`created_at` text NOT NULL
);
