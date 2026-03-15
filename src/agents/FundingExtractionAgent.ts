import { Agent } from '@cloudflare/agents'
import type { Env } from '../env'

/**
 * FundingExtractionAgent — extracts structured funding data from raw articles.
 *
 * Responsibilities:
 * - Consume messages from `candidate-funding-items` queue.
 * - Fetch the article page (plain fetch first; Browser Rendering as fallback).
 * - Extract structured funding fields: startup name, round type, amount,
 *   announced date, source, summary, confidence score.
 * - Classify whether the content is actually a funding announcement.
 * - Write `startups` and `funding_events` records to D1.
 * - Enqueue an enrichment job onto `startup-enrichment-jobs`.
 *
 * Triggered by: `queue` handler in src/index.ts for queue `candidate-funding-items`.
 */
export class FundingExtractionAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    // TODO: implement funding extraction
    // 1. Parse raw_item id from request body
    // 2. Fetch article URL (plain fetch first, BROWSER binding as fallback)
    // 3. Parse HTML to extract funding details
    // 4. Classify confidence score
    // 5. Upsert startup record by canonical name / domain
    // 6. Insert funding_event record
    // 7. Update raw_item status to 'done' or 'failed'
    // 8. Enqueue to STARTUP_ENRICHMENT_QUEUE
    const _body = await request.json().catch(() => null)
    return Response.json({ ok: true })
  }
}
