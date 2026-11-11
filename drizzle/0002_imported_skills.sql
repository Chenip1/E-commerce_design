CREATE TABLE `workshop_imported_skills` (
	`owner` text NOT NULL,
	`source` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `source`)
);
