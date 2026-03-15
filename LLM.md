

# Funding-to-Opportunity Tracker

**V1 High-Level Design and Low-Level Design**

## 1. Product Definition

### 1.1 Goal

Build a Cloudflare-native product that tracks recently funded startups from allowed public sources, enriches each startup with hiring and outreach signals, and sends a **biweekly** email digest to subscribers.

### 1.2 Core User Value

This product is designed for students and job seekers who want to discover startups shortly after funding events, when hiring momentum is often highest.

The product should help users answer:

- Which startups recently raised money?
- Are they hiring?
- If not explicitly hiring, who is the best public contact to reach out to?
- Where can I read the full startup details later?


### 1.3 V1 Scope

V1 includes:

- Global biweekly digest.
- Top 10 startups in each email.
- Authenticated user only archive.
- Welcome email after subscription.
- Email OTP login for archive access.
- 30-day session cookie after login.
- Startup enrichment with:
    - official website,
    - funding summary,
    - hiring signal,
    - careers page if available,
    - public contact email if available,
    - founder/exec social profiles,
    - best first contact recommendation.


### 1.4 V1 Non-Goals

V1 does **not** include:

- Inbound email handling.
- Personalized filters.
- LinkedIn-specific enrichment.
- Human review workflow.
- Internal admin panel.
- Full article body storage.


### 1.5 Source Strategy

V1 source strategy is:

- Use verified and low-friction public sources first.
- Use RSS where available.
- Use the official Hacker News API/RSS path instead of scraping HN HTML.[^6][^7]
- Store extracted summaries and source URLs instead of full source article bodies.

Initial source tiers:

- Tier 1:
    - TechCrunch RSS.[^8][^9]
    - Hacker News API/RSS.[^7][^6]
    - Y Combinator blog RSS after setup verification.[^10]
- Tier 2:
    - Manually verified VC blogs/newsrooms.
- Tier 3:
    - Crunchbase and PitchBook only after compliant access is confirmed, because the search results were not as clean or clearly first-party as TechCrunch or HN.[^11][^12]

***

## 2. High-Level Design

### 2.1 Final Tech Stack

Frontend:

- React
- Vite
- shadcn/ui

Application runtime:

- Cloudflare Workers
- Hono

Data and background services:

- Cloudflare Agents
- Cloudflare D1
- Cloudflare Queues
- Cloudflare Browser Rendering

Email:

- Resend

Authentication:

- Email OTP
- 30-day signed session cookie

This stack keeps the whole app serverless and within one Cloudflare project. Cloudflare documents Hono on Workers and Workers-based static asset serving for SPA-style applications, which matches this architecture well.[^2][^13][^1]

### 2.2 System Boundary

This is a **single-project** deployment.

One Cloudflare Workers project will contain:

- SPA static assets.
- Hono API routes.
- Agent orchestration.
- Queue consumers.
- Cron triggers.
### 2.3 High-Level Components

The system has six main components:

1. **SPA Frontend**
    - Subscription flow.
    - Login flow.
    - Archive UI.
    - Digest detail pages.
2. **Hono API Layer**
    - Auth endpoints.
    - Subscription endpoints.
    - Archive endpoints.
    - Session verification.
3. **Agent Layer**
    - Source polling.
    - Funding extraction.
    - Startup enrichment.
    - Digest generation.
4. **D1 Database**
    - Source config.
    - Startup records.
    - Funding events.
    - Enrichment results.
    - Subscribers.
    - OTPs.
    - Sessions.
    - Digests.
5. **Queue Layer**
    - Candidate funding item queue.
    - Enrichment job queue.
6. **External Email Layer**
    - OTP email sending.
    - Welcome email sending.
    - Biweekly digest sending.

### 2.4 Why This Architecture

This project is not a one-shot request/response app. It needs recurring polling, remembered state, async work, retries, and scheduled digest generation, which is why Agents, D1, and Queues fit well here.[^3][^4]
Browser Rendering is included only for pages that require JavaScript rendering, not as the default fetch path.[^5][^15]

### 2.5 Core Product Rules

The following rules are fixed:

- Default communication is biweekly email.
- The email includes only the top 10 startups.
- If more startups are found, the email mentions that more are available in the archive.
- Archive access requires login.
- Email delivery requires active subscription.
- Login and subscription are separate concepts.
- Subscribing triggers a welcome email.
- Archive contains all startups found, not only the top 10.
- Public contact discovery is allowed.
- Best first contact should be shown when discoverable.
- Only authenticated user should be able to subscribe.

***

## 3. Low-Level Design

### 3.1 Frontend Design

#### Pages

The frontend has these pages:

- `/`
    - Product landing page.
    - Short explanation.
    - Subscribe CTA(should redirect to login page if not authenticated).
    - Login CTA.
- `/subscribe`
    - Subscribe action.
    - Success state.
- `/login`
    - Email input.
    - Request OTP.
    - Verify OTP.
- `/archive`
    - Protected page.
    - List of digest issues.
    - List of startups found.
- `/archive/:digestId`
    - Protected page.
    - Digest metadata.
    - Top 10 startups included in email.
    - Link/list of all other startups found in that period.
- `/startup/:startupId`
    - Protected page.
    - Full startup details.
    - Funding summary.
    - Hiring signal.
    - Contact information.
    - Best first contact.


#### Frontend State

The SPA should maintain:

- auth state,
- subscription state,
- archive pagination,
- digest detail state,
- startup detail state.


#### Frontend Components

Core UI components:

- Navbar
- Hero section
- Subscribe form
- OTP form
- Digest list
- Digest card
- Startup card
- Startup detail panel
- Protected route wrapper
- Session status badge


### 3.2 Backend Design

#### Backend Runtime

The backend is a Hono app running on Cloudflare Workers. Cloudflare’s docs explicitly support Hono on Workers, and Workers can serve static assets for SPA-style deployments in the same project.[^1][^2]

#### Route Groups

The Hono app should have these route groups:

##### Auth

- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`
- `GET /api/auth/session`


##### Subscription

- `POST /api/subscribe`
- `POST /api/unsubscribe`
- `GET /api/subscription/status`


##### Archive

- `GET /api/archive`
- `GET /api/archive/:digestId`
- `GET /api/startups/:startupId`


##### Internal system endpoints

- No public admin routes in v1.
- Optional internal cron-trigger(for testing) routes may exist but should be protected or bound to scheduled execution only.


### 3.3 Auth Design

#### Auth Model

V1 auth is email OTP plus signed session cookie.

Rules:

- Any user can request OTP and log in.
- Only subscribed users receive digests.
- Any logged-in user can access archive only if they are a subscriber.
- After successful OTP verification, the system issues a 30-day secure session cookie.

Hono provides cookie helpers, and Workers can set/read cookies using normal request/response header handling.[^16][^17][^18]

#### OTP Flow

1. User enters email.
2. API validates format.
3. API rate-limits OTP requests.
4. API generates 6-digit OTP.
5. API hashes OTP.
6. API stores hashed OTP with expiry and attempt limit.
7. API sends OTP via Resend.
8. User submits email + OTP.
9. API verifies hash and expiry.
10. API creates session row.
11. API sets signed HTTP-only cookie.
12. User is logged in.

#### Session Cookie Settings

Cookie settings:

- `HttpOnly = true`
- `Secure = true`
- `SameSite = Lax`
- `Path = /`
- `Max-Age = 30 days`


#### Subscription vs Login

This distinction is fixed:

- **Login** grants access to archive.
- **Subscribe** opts the email into digest delivery.
- A user who subscribes receives:
    - subscriber record,
    - welcome email.


### 3.4 Agent Design

#### 3.4.1 SourcePollerAgent

Responsibilities:

- Poll source list on schedule.
- Fetch RSS feeds and HN API results.
- Normalize feed entries.
- Deduplicate using source URL, external ID, and content hash.
- Insert raw candidate items.
- Push queue jobs for extraction.

Inputs:

- source configs from D1

Outputs:

- `raw_items`
- `candidate_funding_items` queue messages

Schedule:

- periodic source polling
- exact cadence configurable per source


#### 3.4.2 FundingExtractionAgent

Responsibilities:

- Consume candidate funding messages.
- Fetch article page.
- Extract structured funding data.
- Classify whether content is actually about a funding event.
- Produce startup and funding event records.
- Generate extracted summary for archive and email use.

Extracted fields:

- startup name
- round type
- amount text
- normalized amount if possible
- announced date
- source URL
- source name
- short summary
- confidence score

Outputs:

- `startups`
- `funding_events`


#### 3.4.3 StartupEnrichmentAgent

Responsibilities:

- Resolve official startup website.
- Find careers page if available.
- Find jobs page if available.
- Find public contact email if available.
- Find public contact page if available.
- Find founder/exec public profiles.
- Find hiring manager profile if discoverable.
- Score hiring signal.
- Recommend best first contact.

Rules:

- Lack of a careers page does **not** block inclusion.
- Public outreach paths remain useful even if no jobs page exists.
- Only public and legitimate discovery is allowed.
- Browser Rendering is used only when plain fetch is insufficient.[^15][^5]

Stored enrichment:

- website URL
- careers URL
- jobs URL
- public email
- contact page URL
- founder/exec profile links
- hiring manager profile link
- hiring signal score
- outreach notes
- best first contact


#### 3.4.4 DigestAgent

Responsibilities:

- Run on biweekly schedule.
- Select candidate startups from recent period.
- Rank startups.
- Choose top 10 for email.
- Build HTML email.
- Store digest and digest items.
- Send email to active subscribers.
- Mention archive if more startups were found.

Digest rules:

- Exactly top 10 included in email if at least 10 exist.
- If fewer than 10 exist, include all.
- Archive stores all startups found in period.
- Email stays concise.
- Archive contains full details.


#### 3.4.5 WelcomeEmailFlow

When a user subscribes:

1. Create subscriber record.
2. Send welcome email.
3. Welcome email explains:
    - biweekly digest schedule,
    - login flow,
    - unsubscribe path.

### 3.5 Queue Design

Use two queues:

#### Queue 1: `candidate_funding_items`

Purpose:

- decouple polling from extraction

Producer:

- SourcePollerAgent

Consumer:

- FundingExtractionAgent


#### Queue 2: `startup_enrichment_jobs`

Purpose:

- decouple extraction from enrichment

Producer:

- FundingExtractionAgent

Consumer:

- StartupEnrichmentAgent

Queues are appropriate here because they provide durable async processing and consumer retry behavior for background workloads.[^4][^19]

### 3.6 Database Design

D1 is the single relational database for the app. Cloudflare documents D1 as its serverless SQL database for Worker-based apps.[^20][^3]

#### `sources`

- `id`
- `name`
- `type` (`rss`, `api`)
- `url`
- `enabled`
- `poll_interval_minutes`
- `last_polled_at`
- `last_status`
- `created_at`
- `updated_at`


#### `raw_items`

- `id`
- `source_id`
- `external_id`
- `title`
- `url`
- `published_at`
- `content_hash`
- `fetched_at`
- `status`
- `created_at`


#### `startups`

- `id`
- `canonical_name`
- `domain`
- `website_url`
- `category`
- `headquarters`
- `created_at`
- `updated_at`


#### `funding_events`

- `id`
- `startup_id`
- `round_type`
- `amount_text`
- `amount_value_usd`
- `announced_at`
- `source_name`
- `source_url`
- `summary`
- `confidence_score`
- `created_at`


#### `startup_enrichment`

- `id`
- `startup_id`
- `careers_url`
- `jobs_url`
- `public_email`
- `contact_page_url`
- `founder_profiles_json`
- `executive_profiles_json`
- `hiring_manager_profiles_json`
- `best_first_contact_type`
- `best_first_contact_value`
- `best_first_contact_reason`
- `hiring_signal_score`
- `hiring_notes`
- `last_checked_at`
- `created_at`
- `updated_at`


#### `subscribers`

- `id`
- `email`
- `is_active`
- `subscribed_at`
- `unsubscribed_at`
- `last_sent_at`
- `welcome_email_sent_at`
- `created_at`
- `updated_at`


#### `auth_otps`

- `id`
- `email`
- `otp_hash`
- `expires_at`
- `attempt_count`
- `max_attempts`
- `last_sent_at`
- `created_at`


#### `sessions`

- `id`
- `subscriber_id`
- `session_token_hash`
- `expires_at`
- `last_seen_at`
- `created_at`


#### `digests`

- `id`
- `period_start`
- `period_end`
- `subject`
- `html_body`
- `top_count`
- `total_found_count`
- `created_at`


#### `digest_items`

- `id`
- `digest_id`
- `startup_id`
- `funding_event_id`
- `rank_order`
- `included_in_email`
- `reason_included`
- `created_at`


### 3.7 Ranking Logic

Ranking is fixed as an explainable rule-based score, not a black-box model.

Score inputs:

- funding recency,
- source confidence,
- enrichment completeness,
- hiring signal,
- public contact availability,
- multi-source mention count.

Example conceptual formula:

$$
score = recency + source\_confidence + enrichment + hiring + contact + cross\_source
$$

Ranking behavior:

- More recent funding = higher score.
- Official careers page = strong positive.
- Public recruiting or exec contact = positive.
- Multiple source mentions = positive.
- Weak extraction confidence = negative.


### 3.8 Archive Model

Archive is authenticated-only.

Archive behavior:

- Show all digests.
- Show all startups found in each digest period.
- The digest detail view should distinguish:
    - top 10 startups included in email,
    - additional startups found but not included in email.

Each startup detail page contains:

- startup name
- website
- funding summary
- source links
- hiring signal
- careers/jobs links if available
- public contact details
- founder/exec/hiring manager profiles
- best first contact recommendation


### 3.9 Email Design

#### OTP Email

Purpose:

- login verification

Contents:

- OTP code
- expiry time
- note if the request was not initiated by user


#### Welcome Email

Purpose:

- confirm subscription

Contents:

- welcome message
- biweekly digest explanation
- unsubscribe instructions


#### Biweekly Digest Email

Purpose:

- deliver top 10 startup opportunities

Contents per startup:

- startup name
- one-line funding summary
- short reason it matters
- high-level hiring signal
- best first contact
- archive link for full details

Footer:

- number of extra startups not shown in email
- link to archive
- unsubscribe link

Resend fits the MVP well because its pricing docs list a free tier with 100 emails per day and 3,000 transactional emails per month.[^21][^22]

### 3.10 Deployment Model

This is a **single Cloudflare Workers project**.

The deployment includes:

- Worker code
- Hono API
- static frontend assets
- D1 binding
- Queue bindings
- cron triggers
- Browser Rendering binding
- environment secrets
- Resend API key

Workers static assets support serving SPA assets with Worker logic in the same application boundary.[^13][^23][^2]

***

## 4. End-to-End Flows

### 4.1 Subscription Flow

1. User visits `/subscribe`.
2. User enters email.
3. Frontend calls `POST /api/subscribe`.
4. Backend creates or updates subscriber.
5. Backend marks subscriber active.
6. Backend sends welcome email.
7. User is now subscribed to biweekly digest.

### 4.2 Login Flow

1. User visits `/login`.
2. User enters email.
3. Frontend calls `POST /api/auth/request-otp`.
4. Backend creates OTP record.
5. Backend emails OTP through Resend.
6. User submits OTP.
7. Frontend calls `POST /api/auth/verify-otp`.
8. Backend verifies OTP.
9. Backend creates session.
10. Backend sets signed 30-day cookie.
11. User can now access archive.

### 4.3 Source Ingestion Flow

1. Cron triggers SourcePollerAgent every day at fixed time.
2. Agent polls TechCrunch RSS, HN API/RSS, and enabled YC or VC sources.[^9][^6][^7][^8][^10]
3. Agent normalizes feed items.
4. Agent deduplicates feed items.
5. Agent writes `raw_items`.
6. Agent enqueues candidate funding jobs.

### 4.4 Extraction Flow

1. FundingExtractionAgent consumes queue messages.
2. Agent fetches the source article.
3. Agent extracts structured funding information.
4. Agent writes startup and funding event records.
5. Agent writes extracted summary and source URL.
6. Agent enqueues enrichment job.

### 4.5 Enrichment Flow

1. StartupEnrichmentAgent consumes enrichment job.
2. Agent resolves official company website.
3. Agent searches for careers and jobs pages.
4. Agent searches for public email and contact page.
5. Agent discovers founder/exec public profiles.
6. Agent looks for hiring manager profile if discoverable.
7. Agent computes hiring signal.
8. Agent stores best first contact recommendation.

### 4.6 Digest Generation Flow

1. Biweekly schedule triggers DigestAgent.
2. Agent selects startups within the digest period.
3. Agent ranks all startups.
4. Agent stores all startups in digest archive.
5. Agent selects top 10 for email.
6. Agent generates email HTML.
7. Agent stores sent digest HTML.
8. Agent sends email to all active subscribers.
9. If more startups exist, email links users to archive.

### 4.7 Archive Access Flow

1. Logged-in subscriber opens `/archive`.
2. Frontend requests `GET /api/archive`.
3. Backend validates session cookie.
4. Backend verifies subscription is active.
5. Backend returns digest list.
6. User opens digest or startup detail pages.

***

## 5. Implementation Decisions

### 5.1 Fixed Decisions

- One Cloudflare Workers project.
- React + Vite + shadcn/ui SPA.
- Hono API on Workers.
- Cloudflare Agents for orchestration.
- D1 as only primary database.
- Queues for async work.
- Browser Rendering only when needed.
- Resend for all outbound email.
- Email OTP auth only.
- 30-day session cookie.
- Biweekly digest only in v1.
- Welcome email on subscription.
- Archive visible only to logged-in subscribers.
- Global feed only.
- Email contains top 10 startups.
- Archive contains all startups.


### 5.2 Error Handling

Polling failure:

- mark source failure,
- continue with other sources,
- retry next schedule.

Extraction failure:

- retry through queue consumption,
- mark item failed after retry exhaustion.

Enrichment failure:

- save partial enrichment,
- allow retry on next enrichment attempt.

Digest failure:

- snapshot digest before send,
- retry sending with stored digest content.

OTP failure:

- enforce attempt limit,
- expire OTP,
- require new OTP request after exhaustion.


### 5.3 Security Rules

- Hash OTP before storing.
- Hash session token before storing.
- Use signed cookie.
- Use HTTP-only secure cookie.
- Rate-limit OTP requests.
- Rate-limit OTP verification attempts.
- Validate subscription state separately from login state.
- Only expose archive to authenticated subscribed users.
- Only use public and legitimate contact discovery.


### 5.4 Cost Controls

- Fetch pages normally first.
- Use Browser Rendering only for JS-heavy pages.[^5][^15]
- Store summaries and source URLs, not full article bodies.
- Keep one database.
- Keep two queues only.
- Keep one project deployment.
- Keep one digest cadence.


### 5.5 MVP Success Criteria

The MVP is successful if it can:

- ingest at least a few reliable sources,
- detect funding events with acceptable precision,
- enrich startups with useful contact/hiring data,
- send biweekly digest through Resend,
- let subscribed users log in and browse full archive,
- demonstrate a clean Cloudflare-native architecture.

***

## Appendix: Suggested API Contract

### Auth

#### `POST /api/auth/request-otp`

Request body:

```json
{
  "email": "user@example.com"
}
```

Response:

```json
{
  "success": true
}
```


#### `POST /api/auth/verify-otp`

Request body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true
}
```


#### `POST /api/auth/logout`

Response:

```json
{
  "success": true
}
```


#### `GET /api/auth/session`

Response:

```json
{
  "authenticated": true,
  "subscribed": true,
  "email": "user@example.com"
}
```


### Subscription

#### `POST /api/subscribe`

Request body:

```json
{
  "email": "user@example.com"
}
```

Response:

```json
{
  "success": true,
  "welcomeEmailSent": true
}
```


#### `POST /api/unsubscribe`

Request body:

```json
{
  "email": "user@example.com"
}
```

Response:

```json
{
  "success": true
}
```


### Archive

#### `GET /api/archive`

Response:

```json
{
  "digests": []
}
```


#### `GET /api/archive/:digestId`

Response:

```json
{
  "digest": {},
  "topItems": [],
  "otherItems": []
}
```


#### `GET /api/startups/:startupId`

Response:

```json
{
  "startup": {},
  "fundingEvent": {},
  "enrichment": {}
}
```


***

This markdown is now concrete enough to use as your project spec and implementation reference.[^2][^3][^4][^1]

<div align="center">⁂</div>

[^1]: https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/

[^2]: https://developers.cloudflare.com/workers/static-assets/

[^3]: https://developers.cloudflare.com/d1/

[^4]: https://www.cloudflare.com/en-in/developer-platform/products/cloudflare-queues/

[^5]: https://developers.cloudflare.com/browser-rendering/

[^6]: https://firebase.blog/posts/2014/10/hacker-news-now-has-api-its-firebase/

[^7]: https://github.com/HackerNews/API

[^8]: https://techcrunch.com/tag/rss/

[^9]: https://techcrunch.com/rss-terms-of-use/

[^10]: https://daige.st/en/sources/predefined/y-combinator

[^11]: https://techcrunch.com/2009/12/17/crunchbase-update-twitter-follow/

[^12]: https://rss.feedspot.com/private_equity_rss_feeds/

[^13]: https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/

[^14]: https://developers.cloudflare.com/workers/

[^15]: https://developers.cloudflare.com/agents/api-reference/browse-the-web/

[^16]: https://hono.dev/docs/helpers/cookie

[^17]: https://developers.cloudflare.com/workers/examples/extract-cookie-value/

[^18]: https://developers.cloudflare.com/workers/runtime-apis/request/

[^19]: https://developers.cloudflare.com/queues/get-started/

[^20]: https://developers.cloudflare.com/d1/get-started/

[^21]: https://resend.com/pricing

[^22]: https://resend.com/docs/knowledge-base/account-quotas-and-limits

[^23]: https://developers.cloudflare.com/workers/static-assets/routing/worker-script/

