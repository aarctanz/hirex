import { Agent } from '@cloudflare/agents'
import { eq } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { rawItems, startups, fundingEvents } from '../db/schema'
import { extractFundingFromText, stripHtml } from '../lib/extraction'
import { extractFundingWithAi } from '../lib/ai'
import { fetchPage } from '../lib/crawl'

/**
 * FundingExtractionAgent — extracts structured funding data from raw articles.
 *
 * Uses a two-pass approach:
 * 1. Rule-based heuristic extraction (regex patterns)
 * 2. Workers AI (Llama) to fill gaps and validate
 *
 * Triggered by: queue consumer for `candidate-funding-items`.
 */
export class FundingExtractionAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const body = await request.json().catch(() => null) as { rawItemId?: number } | null
    if (!body?.rawItemId) {
      return Response.json({ error: 'Missing rawItemId' }, { status: 400 })
    }

    const db = createDb(this.env.hirex_db)

    const item = await db
      .select()
      .from(rawItems)
      .where(eq(rawItems.id, body.rawItemId))
      .limit(1)
      .then((rows) => rows[0])

    if (!item) {
      return Response.json({ error: 'Raw item not found' }, { status: 404 })
    }

    try {
      // Mark as processing
      await db.update(rawItems).set({ status: 'processing' }).where(eq(rawItems.id, item.id))

      // Fetch the article
      const page = await fetchPage(item.url)
      const articleText = page?.text ?? ''

      // Pass 1: Rule-based extraction from title + body
      const ruleResult = extractFundingFromText(item.title, articleText)

      // Pass 2: AI extraction to fill gaps
      const aiResult = await extractFundingWithAi(this.env, item.title, articleText)

      // Merge: prefer rule-based where available, fall back to AI
      const startupName = ruleResult.startupName ?? aiResult.startupName
      const roundType = ruleResult.roundType ?? aiResult.roundType
      const amountText = ruleResult.amountText ?? aiResult.amountText
      const summary = ruleResult.summary ?? aiResult.summary
      const confidenceScore = ruleResult.confidenceScore

      // Skip if AI says it's not funding and rule-based confidence is very low
      if (!aiResult.isFunding && confidenceScore < 0.2) {
        await db.update(rawItems).set({ status: 'done' }).where(eq(rawItems.id, item.id))
        return Response.json({ ok: true, skipped: true, reason: 'Not a funding article' })
      }

      if (!startupName) {
        await db.update(rawItems).set({ status: 'failed' }).where(eq(rawItems.id, item.id))
        return Response.json({ ok: true, skipped: true, reason: 'Could not extract startup name' })
      }

      // Upsert startup
      let startup = await db
        .select()
        .from(startups)
        .where(eq(startups.canonicalName, startupName))
        .limit(1)
        .then((rows) => rows[0])

      if (!startup) {
        const domain = this.extractDomain(item.url)
        const [inserted] = await db.insert(startups).values({
          canonicalName: startupName,
          domain,
        }).returning()
        startup = inserted
      }

      // Insert funding event
      await db.insert(fundingEvents).values({
        startupId: startup.id,
        roundType,
        amountText,
        amountValueUsd: ruleResult.amountValueUsd,
        announcedAt: item.publishedAt ?? new Date(),
        sourceName: 'auto-extracted',
        sourceUrl: item.url,
        summary,
        confidenceScore,
      })

      // Mark done
      await db.update(rawItems).set({ status: 'done' }).where(eq(rawItems.id, item.id))

      // Enqueue enrichment
      await this.env.startup_enrichment_jobs.send({ startupId: startup.id })

      return Response.json({ ok: true, startupId: startup.id, startupName })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      await db.update(rawItems).set({ status: 'failed' }).where(eq(rawItems.id, item.id))
      return Response.json({ error: msg }, { status: 500 })
    }
  }

  private extractDomain(url: string): string | null {
    try {
      return new URL(url).hostname
    } catch {
      return null
    }
  }
}
