# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HIREX** is a Cloudflare-native "Funding-to-Opportunity Tracker" that monitors recently funded startups, enriches them with hiring/outreach signals, and delivers biweekly email digests to subscribers. The full product spec is in `LLM.md`.

## Tech Stack

- **Frontend:** React + Vite + shadcn/ui (SPA, served as static assets from Workers)
- **Backend:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 (single SQLite-compatible DB)
- **Background Jobs:** Cloudflare Agents (orchestration), Cloudflare Queues (async decoupling)
- **Web scraping:** Cloudflare Browser Rendering (only for JS-heavy pages; plain fetch is default)
- **Email:** Resend (OTP, welcome, biweekly digest)
- **Auth:** Email OTP → signed HTTP-only session cookie (30-day, SameSite=Lax)

This is a **single Cloudflare Workers project** — one deployment handles the SPA, Hono API, agents, queue consumers, and cron triggers.

## Commands

Once the project is scaffolded, expected commands will be:

```bash
npm run dev          # Local dev (Wrangler dev server)
npm run build        # Vite build + Worker bundle
npm run deploy       # wrangler deploy
npm run db:migrate   # Apply D1 migrations via wrangler d1 migrations apply
```

## Architecture

### Data Pipeline

```
SourcePollerAgent (cron daily)
  → raw_items (D1)
  → candidate_funding_items queue
    → FundingExtractionAgent
      → startups + funding_events (D1)
      → startup_enrichment_jobs queue
        → StartupEnrichmentAgent
          → startup_enrichment (D1)

DigestAgent (cron biweekly)
  → ranks startups → top 10 in email
  → digests + digest_items (D1)
  → sends via Resend to active subscribers
```

### API Routes (Hono)

- `POST /api/auth/request-otp` — generate & email OTP
- `POST /api/auth/verify-otp` — verify OTP, set session cookie
- `POST /api/auth/logout`
- `GET /api/auth/session` — returns `{ authenticated, subscribed, email }`
- `POST /api/subscribe` / `POST /api/unsubscribe`
- `GET /api/subscription/status`
- `GET /api/archive` — protected (authenticated + subscribed)
- `GET /api/archive/:digestId` — returns `{ digest, topItems, otherItems }`
- `GET /api/startups/:startupId` — returns `{ startup, fundingEvent, enrichment }`

### Auth Rules

- Login and subscription are separate: login grants archive access, subscription gets digest emails.
- Archive access requires both: authenticated session **and** active subscription.
- OTP is hashed before storage; session token is hashed before storage.
- Rate-limit both OTP requests and verification attempts.

### Key Business Rules

- Email digest contains exactly top 10 startups (or all if fewer than 10 exist).
- Archive stores **all** startups found in each period, not just the top 10.
- Lack of a careers page does not block a startup from being included.
- Browser Rendering is a fallback only — always try plain `fetch` first.
- Digest email mentions extra startups and links to archive if more than 10 exist.
- Subscribing triggers a welcome email immediately.

### Database Tables

`sources`, `raw_items`, `startups`, `funding_events`, `startup_enrichment`, `subscribers`, `auth_otps`, `sessions`, `digests`, `digest_items`

Full schema with all fields is in `LLM.md` §3.6.

### Ranking Formula (rule-based, not ML)

`score = recency + source_confidence + enrichment_completeness + hiring_signal + contact_availability + cross_source_mentions`

## Deployment

- Single `wrangler.toml` configures Workers, D1 binding, Queue bindings, cron triggers, Browser Rendering binding, and secrets (Resend API key).
- Static SPA assets are served by the same Worker via Workers Static Assets.
