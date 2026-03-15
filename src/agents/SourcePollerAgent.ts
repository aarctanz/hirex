import { Agent } from '@cloudflare/agents'
import type { Env } from '../env'

/**
 * SourcePollerAgent — polls funding news sources on a daily schedule.
 *
 * Responsibilities:
 * - Read enabled sources from D1 `sources` table.
 * - Fetch RSS feeds (TechCrunch, YC, VC blogs) and HN API results.
 * - Normalize and deduplicate feed entries by source URL, external ID, and content hash.
 * - Insert new entries into `raw_items`.
 * - Enqueue each new item onto `candidate-funding-items` queue for extraction.
 *
 * Triggered by: `scheduled` handler in src/index.ts on cron `0 0 * * *`.
 */
export class SourcePollerAgent extends Agent<Env> {
  async onRequest(_request: Request): Promise<Response> {
    // TODO: implement source polling
    // 1. Load sources from DB where enabled = true
    // 2. For each source, fetch RSS/API
    // 3. Parse + normalize entries
    // 4. Deduplicate against existing raw_items (by url, external_id, content_hash)
    // 5. Insert new raw_items with status 'pending'
    // 6. Enqueue each new item to CANDIDATE_FUNDING_QUEUE
    // 7. Update source last_polled_at and last_status
    return Response.json({ ok: true })
  }
}
