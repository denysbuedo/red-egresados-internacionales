CREATE TABLE `sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `expires_at` integer NOT NULL
);
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);
CREATE INDEX `sessions_expiry_idx` ON `sessions` (`expires_at`);
CREATE TABLE `auth_rate_limits` (
  `key` text PRIMARY KEY NOT NULL,
  `attempts` integer NOT NULL,
  `expires_at` integer NOT NULL
);
