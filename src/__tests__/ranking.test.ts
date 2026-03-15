import { describe, it, expect } from 'vitest'

/**
 * Rule-based scoring formula (to be implemented in DigestAgent):
 *   score = recency + source_confidence + enrichment_completeness
 *         + hiring_signal + contact_availability + cross_source_mentions
 *
 * These tests document the intended ranking behavior.
 * Actual implementation will live in src/agents/DigestAgent.ts.
 */

interface ScoreInputs {
  recency: number          // 0–30 (days since announcement, inverted)
  sourceConfidence: number // 0–1
  enrichmentComplete: number // 0–1
  hiringSignal: number     // 0–1
  contactAvailable: number // 0 or 1
  crossSourceMentions: number // count
}

function computeScore(inputs: ScoreInputs): number {
  return (
    inputs.recency * 2 +
    inputs.sourceConfidence * 20 +
    inputs.enrichmentComplete * 15 +
    inputs.hiringSignal * 20 +
    inputs.contactAvailable * 10 +
    inputs.crossSourceMentions * 5
  )
}

function recencyScore(daysAgo: number): number {
  return Math.max(0, 30 - daysAgo)
}

describe('ranking formula', () => {
  it('more recent funding yields higher score', () => {
    const recent = computeScore({
      recency: recencyScore(1),
      sourceConfidence: 0.8,
      enrichmentComplete: 0.5,
      hiringSignal: 0.5,
      contactAvailable: 0,
      crossSourceMentions: 1,
    })
    const old = computeScore({
      recency: recencyScore(25),
      sourceConfidence: 0.8,
      enrichmentComplete: 0.5,
      hiringSignal: 0.5,
      contactAvailable: 0,
      crossSourceMentions: 1,
    })
    expect(recent).toBeGreaterThan(old)
  })

  it('careers page present increases score', () => {
    const base: ScoreInputs = {
      recency: recencyScore(7),
      sourceConfidence: 0.8,
      enrichmentComplete: 0.5,
      hiringSignal: 0,
      contactAvailable: 0,
      crossSourceMentions: 1,
    }
    const withCareers = computeScore({ ...base, hiringSignal: 1 })
    const withoutCareers = computeScore(base)
    expect(withCareers).toBeGreaterThan(withoutCareers)
  })

  it('low source confidence decreases score', () => {
    const highConf = computeScore({
      recency: recencyScore(7),
      sourceConfidence: 0.95,
      enrichmentComplete: 0.5,
      hiringSignal: 0.5,
      contactAvailable: 0,
      crossSourceMentions: 1,
    })
    const lowConf = computeScore({
      recency: recencyScore(7),
      sourceConfidence: 0.2,
      enrichmentComplete: 0.5,
      hiringSignal: 0.5,
      contactAvailable: 0,
      crossSourceMentions: 1,
    })
    expect(highConf).toBeGreaterThan(lowConf)
  })

  it('public contact available increases score', () => {
    const base: ScoreInputs = {
      recency: recencyScore(7),
      sourceConfidence: 0.8,
      enrichmentComplete: 0.5,
      hiringSignal: 0.5,
      contactAvailable: 0,
      crossSourceMentions: 1,
    }
    expect(computeScore({ ...base, contactAvailable: 1 })).toBeGreaterThan(computeScore(base))
  })

  it('multiple source mentions increase score', () => {
    const single = computeScore({
      recency: recencyScore(7),
      sourceConfidence: 0.8,
      enrichmentComplete: 0.5,
      hiringSignal: 0.5,
      contactAvailable: 0,
      crossSourceMentions: 1,
    })
    const multiple = computeScore({
      recency: recencyScore(7),
      sourceConfidence: 0.8,
      enrichmentComplete: 0.5,
      hiringSignal: 0.5,
      contactAvailable: 0,
      crossSourceMentions: 4,
    })
    expect(multiple).toBeGreaterThan(single)
  })
})
