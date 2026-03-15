CREATE TABLE `sources` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `url` text NOT NULL,
  `enabled` integer NOT NULL DEFAULT 1,
  `poll_interval_minutes` integer NOT NULL DEFAULT 60,
  `last_polled_at` integer,
  `last_status` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `raw_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `source_id` integer NOT NULL,
  `external_id` text,
  `title` text NOT NULL,
  `url` text NOT NULL,
  `published_at` integer,
  `content_hash` text NOT NULL,
  `fetched_at` integer NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `created_at` integer NOT NULL,
  FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`)
);

CREATE TABLE `startups` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `canonical_name` text NOT NULL,
  `domain` text,
  `website_url` text,
  `category` text,
  `headquarters` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `funding_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `startup_id` integer NOT NULL,
  `round_type` text,
  `amount_text` text,
  `amount_value_usd` real,
  `announced_at` integer,
  `source_name` text NOT NULL,
  `source_url` text NOT NULL,
  `summary` text,
  `confidence_score` real NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`)
);

CREATE TABLE `startup_enrichment` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `startup_id` integer NOT NULL,
  `careers_url` text,
  `jobs_url` text,
  `public_email` text,
  `contact_page_url` text,
  `founder_profiles_json` text,
  `executive_profiles_json` text,
  `hiring_manager_profiles_json` text,
  `best_first_contact_type` text,
  `best_first_contact_value` text,
  `best_first_contact_reason` text,
  `hiring_signal_score` real NOT NULL DEFAULT 0,
  `hiring_notes` text,
  `last_checked_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`)
);

CREATE TABLE `subscribers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL UNIQUE,
  `is_active` integer NOT NULL DEFAULT 0,
  `subscribed_at` integer,
  `unsubscribed_at` integer,
  `last_sent_at` integer,
  `welcome_email_sent_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `auth_otps` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `otp_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `attempt_count` integer NOT NULL DEFAULT 0,
  `max_attempts` integer NOT NULL DEFAULT 5,
  `last_sent_at` integer NOT NULL,
  `created_at` integer NOT NULL
);

CREATE TABLE `sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `subscriber_id` integer NOT NULL,
  `session_token_hash` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `last_seen_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers`(`id`)
);

CREATE TABLE `digests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `period_start` integer NOT NULL,
  `period_end` integer NOT NULL,
  `subject` text NOT NULL,
  `html_body` text NOT NULL,
  `top_count` integer NOT NULL DEFAULT 0,
  `total_found_count` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL
);

CREATE TABLE `digest_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `digest_id` integer NOT NULL,
  `startup_id` integer NOT NULL,
  `funding_event_id` integer,
  `rank_order` integer NOT NULL,
  `included_in_email` integer NOT NULL DEFAULT 0,
  `reason_included` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`digest_id`) REFERENCES `digests`(`id`),
  FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`),
  FOREIGN KEY (`funding_event_id`) REFERENCES `funding_events`(`id`)
);

CREATE INDEX `idx_raw_items_source_id` ON `raw_items` (`source_id`);
CREATE INDEX `idx_raw_items_status` ON `raw_items` (`status`);
CREATE INDEX `idx_raw_items_content_hash` ON `raw_items` (`content_hash`);
CREATE INDEX `idx_funding_events_startup_id` ON `funding_events` (`startup_id`);
CREATE INDEX `idx_funding_events_announced_at` ON `funding_events` (`announced_at`);
CREATE INDEX `idx_startup_enrichment_startup_id` ON `startup_enrichment` (`startup_id`);
CREATE INDEX `idx_sessions_token_hash` ON `sessions` (`session_token_hash`);
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);
CREATE INDEX `idx_auth_otps_email` ON `auth_otps` (`email`);
CREATE INDEX `idx_auth_otps_expires_at` ON `auth_otps` (`expires_at`);
CREATE INDEX `idx_subscribers_email` ON `subscribers` (`email`);
CREATE INDEX `idx_digest_items_digest_id` ON `digest_items` (`digest_id`);

-- Seed initial sources (Tier 1)
INSERT INTO `sources` (`name`, `type`, `url`, `enabled`, `poll_interval_minutes`, `created_at`, `updated_at`)
VALUES
  ('TechCrunch', 'rss', 'https://techcrunch.com/feed/', 1, 1440, strftime('%s', 'now'), strftime('%s', 'now')),
  ('Hacker News', 'api', 'https://hn.algolia.com/api/v1', 1, 1440, strftime('%s', 'now'), strftime('%s', 'now')),
  ('Y Combinator Blog', 'rss', 'https://www.ycombinator.com/blog/rss/', 1, 1440, strftime('%s', 'now'), strftime('%s', 'now'));
