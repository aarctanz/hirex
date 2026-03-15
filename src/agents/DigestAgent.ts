import { Agent } from '@cloudflare/agents'
import type { Env } from '../env'

/**
 * DigestAgent — generates and sends the biweekly email digest.
 *
 * Responsibilities:
 * - Run on biweekly schedule (cron `0 9 * * 1`).
 * - Select all startups with funding events in the current digest period.
 * - Rank startups using the rule-based scoring formula:
 *     score = recency + source_confidence + enrichment_completeness
 *           + hiring_signal + contact_availability + cross_source_mentions
 * - Select top 10 for email (or all if fewer than 10 exist).
 * - Generate HTML email content.
 * - Store `digest` and `digest_items` records in D1.
 * - Send digest email to all active subscribers via Resend.
 * - Include archive link and mention of extra startups if total > 10.
 *
 * Triggered by: `scheduled` handler in src/index.ts on cron `0 9 * * 1`.
 */
export class DigestAgent extends Agent<Env> {
  async onRequest(_request: Request): Promise<Response> {
    // TODO: implement digest generation
    // 1. Determine period_start and period_end (last 2 weeks)
    // 2. Query startups + funding_events + enrichment for the period
    // 3. Score each startup with rule-based formula
    // 4. Sort by score descending
    // 5. Take top 10 (or all if < 10)
    // 6. Build HTML email with startup summaries
    // 7. Insert digest record
    // 8. Insert digest_items (all found, flag top 10 as included_in_email)
    // 9. Fetch active subscriber emails
    // 10. Send digest via sendDigestEmail()
    return Response.json({ ok: true })
  }
}
