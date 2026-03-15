import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { digests, digestItems, startups, fundingEvents, startupEnrichment } from '../db/schema'
import { validateSubscribedSession } from '../lib/auth'
import { toStartupSummary, toFundingEventSummary, toDigestSummary, toEnrichmentSummary } from '../lib/mappers'
import type { ArchiveListResponse, ArchiveDetailResponse, StartupDetailResponse } from '../types'

export const archiveRoutes = new Hono<{ Bindings: Env }>()

archiveRoutes.get('/archive', async (c) => {
  const auth = await validateSubscribedSession(c)
  if (!auth) {
    return c.json({ error: 'Authentication and active subscription required' }, 401)
  }

  const db = createDb(c.env.DB)
  const allDigests = await db
    .select()
    .from(digests)
    .orderBy(desc(digests.createdAt))

  return c.json<ArchiveListResponse>({
    digests: allDigests.map(toDigestSummary),
  })
})

archiveRoutes.get('/archive/:digestId', async (c) => {
  const auth = await validateSubscribedSession(c)
  if (!auth) {
    return c.json({ error: 'Authentication and active subscription required' }, 401)
  }

  const digestId = parseInt(c.req.param('digestId'), 10)
  if (isNaN(digestId)) {
    return c.json({ error: 'Invalid digest ID' }, 400)
  }

  const db = createDb(c.env.DB)

  const digest = await db
    .select()
    .from(digests)
    .where(eq(digests.id, digestId))
    .limit(1)
    .then((rows) => rows[0])

  if (!digest) {
    return c.json({ error: 'Digest not found' }, 404)
  }

  const items = await db
    .select({ item: digestItems, startup: startups, funding: fundingEvents })
    .from(digestItems)
    .innerJoin(startups, eq(digestItems.startupId, startups.id))
    .leftJoin(fundingEvents, eq(digestItems.fundingEventId, fundingEvents.id))
    .where(eq(digestItems.digestId, digestId))
    .orderBy(digestItems.rankOrder)

  const mapItem = (row: (typeof items)[number]) => ({
    startup: toStartupSummary(row.startup),
    fundingEvent: toFundingEventSummary(row.funding),
    rank: row.item.rankOrder,
  })

  return c.json<ArchiveDetailResponse>({
    digest: toDigestSummary(digest),
    topItems: items.filter((r) => r.item.includedInEmail).map(mapItem),
    otherItems: items.filter((r) => !r.item.includedInEmail).map(mapItem),
  })
})

archiveRoutes.get('/startups/:startupId', async (c) => {
  const auth = await validateSubscribedSession(c)
  if (!auth) {
    return c.json({ error: 'Authentication and active subscription required' }, 401)
  }

  const startupId = parseInt(c.req.param('startupId'), 10)
  if (isNaN(startupId)) {
    return c.json({ error: 'Invalid startup ID' }, 400)
  }

  const db = createDb(c.env.DB)

  const startup = await db
    .select()
    .from(startups)
    .where(eq(startups.id, startupId))
    .limit(1)
    .then((rows) => rows[0])

  if (!startup) {
    return c.json({ error: 'Startup not found' }, 404)
  }

  const fundingEvent = await db
    .select()
    .from(fundingEvents)
    .where(eq(fundingEvents.startupId, startupId))
    .orderBy(desc(fundingEvents.announcedAt))
    .limit(1)
    .then((rows) => rows[0] ?? null)

  const enrichment = await db
    .select()
    .from(startupEnrichment)
    .where(eq(startupEnrichment.startupId, startupId))
    .limit(1)
    .then((rows) => rows[0] ?? null)

  return c.json<StartupDetailResponse>({
    startup: toStartupSummary(startup),
    fundingEvent: toFundingEventSummary(fundingEvent),
    enrichment: toEnrichmentSummary(enrichment),
  })
})
