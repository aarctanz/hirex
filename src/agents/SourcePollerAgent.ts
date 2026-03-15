import { Agent } from '@cloudflare/agents'
import { eq } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { sources, rawItems } from '../db/schema'
import { isFundingRelated } from '../lib/extraction'
import { fetchAndParseRss } from '../lib/rss'

/**
 * SourcePollerAgent — polls funding news sources on a daily schedule.
 *
 * Triggered by: `scheduled` handler on cron `0 0 * * *`.
 */
export class SourcePollerAgent extends Agent<Env> {
  async onRequest(_request: Request): Promise<Response> {
    const db = createDb(this.env.hirex_db)
    const enabledSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, true))

    const results: Array<{ sourceId: number; added: number; errors: string[] }> = []

    for (const source of enabledSources) {
      try {
        const items = source.type === 'rss'
          ? await this.pollRss(source.url)
          : await this.pollHnApi()

        let added = 0
        for (const item of items) {
          if (!isFundingRelated(item.title)) continue

          const contentHash = await this.hash(item.url + item.title)

          // Deduplicate
          const existing = await db
            .select({ id: rawItems.id })
            .from(rawItems)
            .where(eq(rawItems.contentHash, contentHash))
            .limit(1)

          if (existing.length > 0) continue

          const [inserted] = await db.insert(rawItems).values({
            sourceId: source.id,
            externalId: item.externalId ?? null,
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
            contentHash,
            status: 'pending',
          }).returning()

          await this.env.candidate_funding_items.send({ rawItemId: inserted.id })
          added++
        }

        await db
          .update(sources)
          .set({ lastPolledAt: new Date(), lastStatus: 'ok', updatedAt: new Date() })
          .where(eq(sources.id, source.id))

        results.push({ sourceId: source.id, added, errors: [] })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        await db
          .update(sources)
          .set({ lastPolledAt: new Date(), lastStatus: `error: ${msg}`, updatedAt: new Date() })
          .where(eq(sources.id, source.id))
        results.push({ sourceId: source.id, added: 0, errors: [msg] })
      }
    }

    return Response.json({ ok: true, results })
  }

  private async pollRss(url: string): Promise<Array<{ title: string; url: string; externalId?: string; publishedAt?: string }>> {
    const items = await fetchAndParseRss(url)
    return items.map((item) => ({
      title: item.title,
      url: item.url,
      externalId: item.guid,
      publishedAt: item.publishedAt ?? undefined,
    }))
  }

  private async pollHnApi(): Promise<Array<{ title: string; url: string; externalId?: string; publishedAt?: string }>> {
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=funding+raised+series&tags=story&numericFilters=created_at_i>${oneDayAgo}&hitsPerPage=30`

    const res = await fetch(searchUrl)
    if (!res.ok) return []
    const data = await res.json() as { hits: Array<{ objectID: string; title: string; url: string; created_at_i: number }> }

    return (data.hits ?? [])
      .filter((hit) => hit.url)
      .map((hit) => ({
        title: hit.title,
        url: hit.url,
        externalId: `hn-${hit.objectID}`,
        publishedAt: new Date(hit.created_at_i * 1000).toISOString(),
      }))
  }

  private async hash(input: string): Promise<string> {
    const encoded = new TextEncoder().encode(input)
    const buf = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}
