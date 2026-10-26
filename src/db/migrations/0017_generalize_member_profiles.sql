ALTER TABLE `graduates` ADD COLUMN `member_type` text NOT NULL DEFAULT 'unspecified';
ALTER TABLE `graduates` ADD COLUMN `employment_confirmed` integer NOT NULL DEFAULT 0;
ALTER TABLE `user_posts` ADD COLUMN `post_type` text NOT NULL DEFAULT 'update';
ALTER TABLE `user_posts` ADD COLUMN `reference_url` text;
