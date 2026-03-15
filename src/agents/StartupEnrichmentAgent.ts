import { Agent } from '@cloudflare/agents'
import type { Env } from '../env'

/**
 * StartupEnrichmentAgent — enriches startup records with hiring and contact signals.
 *
 * Responsibilities:
 * - Consume messages from `startup-enrichment-jobs` queue.
 * - Resolve the official startup website.
 * - Discover careers and jobs pages (plain fetch first; Browser Rendering as fallback).
 * - Find public contact email and contact page.
 * - Discover founder/exec public social profiles.
 * - Identify hiring manager profile if discoverable.
 * - Compute hiring signal score.
 * - Determine best first contact recommendation.
 * - Write or update `startup_enrichment` record in D1.
 *
 * Rules:
 * - Absence of a careers page does NOT block inclusion.
 * - Only public, legitimate discovery is performed.
 * - Browser Rendering is used only when plain fetch is insufficient.
 *
 * Triggered by: `queue` handler in src/index.ts for queue `startup-enrichment-jobs`.
 */
export class StartupEnrichmentAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    // TODO: implement startup enrichment
    // 1. Parse startup_id from request body
    // 2. Load startup record from D1
    // 3. Resolve official website via plain fetch or search
    // 4. Crawl website for /careers, /jobs, /contact pages
    // 5. Extract public email addresses
    // 6. Search for founder/exec LinkedIn/Twitter profiles
    // 7. Compute hiring_signal_score
    // 8. Determine best_first_contact_type and value
    // 9. Upsert startup_enrichment record
    const _body = await request.json().catch(() => null)
    return Response.json({ ok: true })
  }
}
