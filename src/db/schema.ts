import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const sources = sqliteTable('sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['rss', 'api'] }).notNull(),
  url: text('url').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  pollIntervalMinutes: integer('poll_interval_minutes').notNull().default(60),
  lastPolledAt: integer('last_polled_at', { mode: 'timestamp' }),
  lastStatus: text('last_status'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const rawItems = sqliteTable('raw_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: integer('source_id').notNull().references(() => sources.id),
  externalId: text('external_id'),
  title: text('title').notNull(),
  url: text('url').notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  contentHash: text('content_hash').notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  status: text('status', { enum: ['pending', 'processing', 'done', 'failed'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const startups = sqliteTable('startups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  canonicalName: text('canonical_name').notNull(),
  domain: text('domain'),
  websiteUrl: text('website_url'),
  category: text('category'),
  headquarters: text('headquarters'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const fundingEvents = sqliteTable('funding_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startupId: integer('startup_id').notNull().references(() => startups.id),
  roundType: text('round_type'),
  amountText: text('amount_text'),
  amountValueUsd: real('amount_value_usd'),
  announcedAt: integer('announced_at', { mode: 'timestamp' }),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  summary: text('summary'),
  confidenceScore: real('confidence_score').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const startupEnrichment = sqliteTable('startup_enrichment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startupId: integer('startup_id').notNull().references(() => startups.id),
  careersUrl: text('careers_url'),
  jobsUrl: text('jobs_url'),
  publicEmail: text('public_email'),
  contactPageUrl: text('contact_page_url'),
  founderProfilesJson: text('founder_profiles_json'),
  executiveProfilesJson: text('executive_profiles_json'),
  hiringManagerProfilesJson: text('hiring_manager_profiles_json'),
  bestFirstContactType: text('best_first_contact_type'),
  bestFirstContactValue: text('best_first_contact_value'),
  bestFirstContactReason: text('best_first_contact_reason'),
  hiringSignalScore: real('hiring_signal_score').notNull().default(0),
  hiringNotes: text('hiring_notes'),
  lastCheckedAt: integer('last_checked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const subscribers = sqliteTable('subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  subscribedAt: integer('subscribed_at', { mode: 'timestamp' }),
  unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp' }),
  lastSentAt: integer('last_sent_at', { mode: 'timestamp' }),
  welcomeEmailSentAt: integer('welcome_email_sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const authOtps = sqliteTable('auth_otps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  otpHash: text('otp_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  attemptCount: integer('attempt_count').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(5),
  lastSentAt: integer('last_sent_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriberId: integer('subscriber_id').notNull().references(() => subscribers.id),
  sessionTokenHash: text('session_token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const digests = sqliteTable('digests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  subject: text('subject').notNull(),
  htmlBody: text('html_body').notNull(),
  topCount: integer('top_count').notNull().default(0),
  totalFoundCount: integer('total_found_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const digestItems = sqliteTable('digest_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  digestId: integer('digest_id').notNull().references(() => digests.id),
  startupId: integer('startup_id').notNull().references(() => startups.id),
  fundingEventId: integer('funding_event_id').references(() => fundingEvents.id),
  rankOrder: integer('rank_order').notNull(),
  includedInEmail: integer('included_in_email', { mode: 'boolean' }).notNull().default(false),
  reasonIncluded: text('reason_included'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
