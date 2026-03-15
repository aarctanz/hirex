import { Agent } from '@cloudflare/agents'
import { eq, gte, lte, and, desc, sql } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { startups, fundingEvents, startupEnrichment, subscribers, digests, digestItems } from '../db/schema'
import { computeScore, recencyScore, enrichmentCompleteness } from '../lib/ranking'
import { sendDigestEmail } from '../lib/email'

interface RankedStartup {
  startup: typeof startups.$inferSelect
  funding: typeof fundingEvents.$inferSelect
  enrichment: typeof startupEnrichment.$inferSelect | null
  score: number
}

/**
 * DigestAgent — generates and sends the weekly email digest.
 *
 * Triggered by: `scheduled` handler on cron `0 9 * * 1` (Monday 9am UTC).
 */
export class DigestAgent extends Agent<Env> {
  async onRequest(_request: Request): Promise<Response> {
    const db = createDb(this.env.hirex_db)
    const now = new Date()
    const periodEnd = now
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Find all funding events in the period
    const events = await db
      .select({ funding: fundingEvents, startup: startups })
      .from(fundingEvents)
      .innerJoin(startups, eq(fundingEvents.startupId, startups.id))
      .where(
        and(
          gte(fundingEvents.createdAt, periodStart),
          lte(fundingEvents.createdAt, periodEnd),
        ),
      )
      .orderBy(desc(fundingEvents.createdAt))

    if (events.length === 0) {
      return Response.json({ ok: true, message: 'No funding events this period' })
    }

    // Load enrichment for each startup
    const ranked: RankedStartup[] = []
    const seenStartups = new Set<number>()

    for (const row of events) {
      if (seenStartups.has(row.startup.id)) continue
      seenStartups.add(row.startup.id)

      const enrichment = await db
        .select()
        .from(startupEnrichment)
        .where(eq(startupEnrichment.startupId, row.startup.id))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      // Count cross-source mentions
      const mentionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(fundingEvents)
        .where(eq(fundingEvents.startupId, row.startup.id))
        .then((rows) => rows[0]?.count ?? 1)

      const daysAgo = Math.floor((now.getTime() - (row.funding.announcedAt?.getTime() ?? now.getTime())) / (1000 * 60 * 60 * 24))

      const score = computeScore({
        recency: recencyScore(daysAgo),
        sourceConfidence: row.funding.confidenceScore,
        enrichmentComplete: enrichment
          ? enrichmentCompleteness({
              careersUrl: enrichment.careersUrl,
              jobsUrl: enrichment.jobsUrl,
              publicEmail: enrichment.publicEmail,
              founderProfilesJson: enrichment.founderProfilesJson,
              bestFirstContactValue: enrichment.bestFirstContactValue,
            })
          : 0,
        hiringSignal: enrichment?.hiringSignalScore ?? 0,
        contactAvailable: enrichment?.bestFirstContactValue ? 1 : 0,
        crossSourceMentions: mentionCount,
      })

      ranked.push({ startup: row.startup, funding: row.funding, enrichment, score })
    }

    // Sort by score descending
    ranked.sort((a, b) => b.score - a.score)

    const topCount = Math.min(10, ranked.length)
    const top = ranked.slice(0, topCount)
    const totalFound = ranked.length

    // Generate email HTML
    const subject = `HIREX Weekly: Top ${topCount} Funded Startups (${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()})`
    const htmlBody = this.buildEmailHtml(top, totalFound, subject)

    // Store digest
    const [digest] = await db.insert(digests).values({
      periodStart,
      periodEnd,
      subject,
      htmlBody,
      topCount,
      totalFoundCount: totalFound,
    }).returning()

    // Store all digest items
    for (let i = 0; i < ranked.length; i++) {
      const r = ranked[i]
      await db.insert(digestItems).values({
        digestId: digest.id,
        startupId: r.startup.id,
        fundingEventId: r.funding.id,
        rankOrder: i + 1,
        includedInEmail: i < topCount,
        reasonIncluded: i < topCount ? `Score: ${r.score.toFixed(1)}` : null,
      })
    }

    // Send to active subscribers
    const activeSubscribers = await db
      .select({ email: subscribers.email })
      .from(subscribers)
      .where(eq(subscribers.isActive, true))

    const emails = activeSubscribers.map((s) => s.email)
    if (emails.length > 0) {
      await sendDigestEmail(this.env, emails, htmlBody, subject)

      // Update last_sent_at for subscribers
      await db
        .update(subscribers)
        .set({ lastSentAt: now })
        .where(eq(subscribers.isActive, true))
    }

    return Response.json({
      ok: true,
      digestId: digest.id,
      topCount,
      totalFound,
      subscribersSent: emails.length,
    })
  }

  private buildEmailHtml(top: RankedStartup[], totalFound: number, subject: string): string {
    const rows = top.map((r, i) => {
      const funding = [r.funding.roundType, r.funding.amountText].filter(Boolean).join(' — ')
      const contact = r.enrichment?.bestFirstContactValue
        ? `<br><small>Best contact: <a href="${r.enrichment.bestFirstContactValue}">${r.enrichment.bestFirstContactType}</a></small>`
        : ''
      const website = r.startup.websiteUrl
        ? ` · <a href="${r.startup.websiteUrl}">Website</a>`
        : ''

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>#${i + 1} ${r.startup.canonicalName}</strong>${website}
            <br><span style="color: #666;">${funding || 'Funding details pending'}</span>
            ${r.funding.summary ? `<br><span style="color: #888; font-size: 13px;">${r.funding.summary}</span>` : ''}
            ${contact}
          </td>
        </tr>`
    }).join('')

    const extraNote = totalFound > top.length
      ? `<p style="margin-top: 20px; color: #666;">
           ${totalFound - top.length} more startups were found this week.
           <a href="https://hirex.app/archive">View all in the archive →</a>
         </p>`
      : ''

    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="font-size: 20px; margin-bottom: 4px;">HIREX Weekly Digest</h1>
        <p style="color: #666; margin-top: 0;">${subject}</p>
        <table style="width: 100%; border-collapse: collapse;">
          ${rows}
        </table>
        ${extraNote}
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999;">
          You're receiving this because you subscribed to HIREX.
          <a href="https://hirex.app/login">Log in</a> to manage your subscription.
        </p>
      </body>
      </html>
    `
  }
}
