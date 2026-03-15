/**
 * Workers AI helpers using free Llama model for structured extraction.
 */

import type { Env } from '../env'

const MODEL = '@cf/meta/llama-3.1-8b-instruct'

export interface AiFundingResult {
  startupName: string | null
  roundType: string | null
  amountText: string | null
  summary: string | null
  isFunding: boolean
}

export interface AiEnrichmentResult {
  founderNames: string[]
  founderProfiles: Array<{ name: string; url: string; platform: string }>
  executiveProfiles: Array<{ name: string; url: string; platform: string }>
  publicEmail: string | null
  hiringNotes: string | null
}

async function runAi<T>(env: Env, system: string, user: string, fallback: T): Promise<T> {
  try {
    const response = await (env.AI as any).run(MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }) as { response?: string }

    const text = response.response ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallback
    return JSON.parse(jsonMatch[0]) as T
  } catch {
    return fallback
  }
}

const FUNDING_FALLBACK: AiFundingResult = {
  startupName: null, roundType: null, amountText: null, summary: null, isFunding: false,
}

const ENRICHMENT_FALLBACK: AiEnrichmentResult = {
  founderNames: [], founderProfiles: [], executiveProfiles: [], publicEmail: null, hiringNotes: null,
}

export async function extractFundingWithAi(env: Env, title: string, bodyText: string): Promise<AiFundingResult> {
  return runAi(
    env,
    `You extract startup funding information from articles. Respond ONLY with valid JSON matching this schema:
{"startupName": string|null, "roundType": string|null, "amountText": string|null, "summary": string|null, "isFunding": boolean}
- startupName: the company that received funding
- roundType: e.g. "Seed", "Series A", "Series B", etc.
- amountText: the funding amount as written, e.g. "$5 million"
- summary: one sentence summary of the funding event
- isFunding: true if this article is about a startup funding event`,
    `Title: ${title}\n\nArticle text:\n${bodyText.slice(0, 3000)}`,
    FUNDING_FALLBACK,
  )
}

export async function extractEnrichmentWithAi(env: Env, pageText: string, startupName: string): Promise<AiEnrichmentResult> {
  return runAi(
    env,
    `You extract company contact and team information from web pages. Respond ONLY with valid JSON matching this schema:
{"founderNames": string[], "founderProfiles": [{"name": string, "url": string, "platform": string}], "executiveProfiles": [{"name": string, "url": string, "platform": string}], "publicEmail": string|null, "hiringNotes": string|null}
- founderProfiles/executiveProfiles: LinkedIn, Twitter/X, or other social profiles found
- platform: "linkedin", "twitter", "github", etc.
- publicEmail: any public contact email found
- hiringNotes: brief note about hiring status if mentioned`,
    `Company: ${startupName}\n\nPage text:\n${pageText.slice(0, 3000)}`,
    ENRICHMENT_FALLBACK,
  )
}
