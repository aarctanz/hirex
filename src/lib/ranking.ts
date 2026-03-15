/**
 * Rule-based startup ranking formula.
 * score = recency + source_confidence + enrichment_completeness
 *       + hiring_signal + contact_availability + cross_source_mentions
 */

export interface ScoreInputs {
  recency: number
  sourceConfidence: number
  enrichmentComplete: number
  hiringSignal: number
  contactAvailable: number
  crossSourceMentions: number
}

export function recencyScore(daysAgo: number): number {
  return Math.max(0, 30 - daysAgo)
}

export function enrichmentCompleteness(fields: {
  careersUrl: string | null
  jobsUrl: string | null
  publicEmail: string | null
  founderProfilesJson: string | null
  bestFirstContactValue: string | null
}): number {
  let filled = 0
  let total = 5
  if (fields.careersUrl) filled++
  if (fields.jobsUrl) filled++
  if (fields.publicEmail) filled++
  if (fields.founderProfilesJson) filled++
  if (fields.bestFirstContactValue) filled++
  return filled / total
}

export function computeScore(inputs: ScoreInputs): number {
  return (
    inputs.recency * 2 +
    inputs.sourceConfidence * 20 +
    inputs.enrichmentComplete * 15 +
    inputs.hiringSignal * 20 +
    inputs.contactAvailable * 10 +
    inputs.crossSourceMentions * 5
  )
}
