export interface SessionResponse {
  authenticated: boolean
  subscribed: boolean
  email: string | null
}

export interface SubscriptionStatusResponse {
  subscribed: boolean
  email: string | null
}

export interface DigestSummary {
  id: number
  subject: string
  periodStart: string
  periodEnd: string
  topCount: number
  totalFoundCount: number
  createdAt: string
}

export interface StartupSummary {
  id: number
  canonicalName: string
  domain: string | null
  websiteUrl: string | null
  category: string | null
  headquarters: string | null
}

export interface FundingEventSummary {
  id: number
  roundType: string | null
  amountText: string | null
  amountValueUsd: number | null
  announcedAt: string | null
  sourceName: string
  sourceUrl: string
  summary: string | null
  confidenceScore: number
}

export interface EnrichmentSummary {
  careersUrl: string | null
  jobsUrl: string | null
  publicEmail: string | null
  contactPageUrl: string | null
  founderProfiles: unknown[]
  executiveProfiles: unknown[]
  hiringManagerProfiles: unknown[]
  bestFirstContactType: string | null
  bestFirstContactValue: string | null
  bestFirstContactReason: string | null
  hiringSignalScore: number
  hiringNotes: string | null
}

export interface ArchiveListResponse {
  digests: DigestSummary[]
}

export interface ArchiveDetailResponse {
  digest: DigestSummary
  topItems: Array<{ startup: StartupSummary; fundingEvent: FundingEventSummary | null; rank: number }>
  otherItems: Array<{ startup: StartupSummary; fundingEvent: FundingEventSummary | null; rank: number }>
}

export interface StartupDetailResponse {
  startup: StartupSummary
  fundingEvent: FundingEventSummary | null
  enrichment: EnrichmentSummary | null
}

export interface ErrorResponse {
  error: string
}
