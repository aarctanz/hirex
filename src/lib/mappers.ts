import type { startups, fundingEvents, digests, startupEnrichment } from '../db/schema'
import type { StartupSummary, FundingEventSummary, DigestSummary, EnrichmentSummary } from '../types'

export function toStartupSummary(s: typeof startups.$inferSelect): StartupSummary {
  return {
    id: s.id,
    canonicalName: s.canonicalName,
    domain: s.domain,
    websiteUrl: s.websiteUrl,
    category: s.category,
    headquarters: s.headquarters,
  }
}

export function toFundingEventSummary(f: typeof fundingEvents.$inferSelect | null): FundingEventSummary | null {
  if (!f) return null
  return {
    id: f.id,
    roundType: f.roundType,
    amountText: f.amountText,
    amountValueUsd: f.amountValueUsd,
    announcedAt: f.announcedAt?.toISOString() ?? null,
    sourceName: f.sourceName,
    sourceUrl: f.sourceUrl,
    summary: f.summary,
    confidenceScore: f.confidenceScore,
  }
}

export function toDigestSummary(d: typeof digests.$inferSelect): DigestSummary {
  return {
    id: d.id,
    subject: d.subject,
    periodStart: d.periodStart.toISOString(),
    periodEnd: d.periodEnd.toISOString(),
    topCount: d.topCount,
    totalFoundCount: d.totalFoundCount,
    createdAt: d.createdAt.toISOString(),
  }
}

function safeParseJsonArray(raw: string | null): unknown[] {
  if (!raw) return []
  try { return JSON.parse(raw) as unknown[] } catch { return [] }
}

export function toEnrichmentSummary(e: typeof startupEnrichment.$inferSelect | null): EnrichmentSummary | null {
  if (!e) return null
  return {
    careersUrl: e.careersUrl,
    jobsUrl: e.jobsUrl,
    publicEmail: e.publicEmail,
    contactPageUrl: e.contactPageUrl,
    founderProfiles: safeParseJsonArray(e.founderProfilesJson),
    executiveProfiles: safeParseJsonArray(e.executiveProfilesJson),
    hiringManagerProfiles: safeParseJsonArray(e.hiringManagerProfilesJson),
    bestFirstContactType: e.bestFirstContactType,
    bestFirstContactValue: e.bestFirstContactValue,
    bestFirstContactReason: e.bestFirstContactReason,
    hiringSignalScore: e.hiringSignalScore,
    hiringNotes: e.hiringNotes,
  }
}
