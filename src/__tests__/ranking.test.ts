import { describe, it, expect } from 'vitest'
import { computeScore, recencyScore } from '../lib/ranking'

describe('ranking formula', () => {
  it('more recent funding yields higher score', () => {
    const base = { sourceConfidence: 0.8, enrichmentComplete: 0.5, hiringSignal: 0.5, contactAvailable: 0, crossSourceMentions: 1 }
    const recent = computeScore({ ...base, recency: recencyScore(1) })
    const old = computeScore({ ...base, recency: recencyScore(25) })
    expect(recent).toBeGreaterThan(old)
  })

  it('careers page present increases score', () => {
    const base = { recency: recencyScore(7), sourceConfidence: 0.8, enrichmentComplete: 0.5, contactAvailable: 0, crossSourceMentions: 1 }
    const withCareers = computeScore({ ...base, hiringSignal: 1 })
    const withoutCareers = computeScore({ ...base, hiringSignal: 0 })
    expect(withCareers).toBeGreaterThan(withoutCareers)
  })

  it('low source confidence decreases score', () => {
    const base = { recency: recencyScore(7), enrichmentComplete: 0.5, hiringSignal: 0.5, contactAvailable: 0, crossSourceMentions: 1 }
    const highConf = computeScore({ ...base, sourceConfidence: 0.95 })
    const lowConf = computeScore({ ...base, sourceConfidence: 0.2 })
    expect(highConf).toBeGreaterThan(lowConf)
  })

  it('public contact available increases score', () => {
    const base = { recency: recencyScore(7), sourceConfidence: 0.8, enrichmentComplete: 0.5, hiringSignal: 0.5, crossSourceMentions: 1 }
    expect(computeScore({ ...base, contactAvailable: 1 })).toBeGreaterThan(computeScore({ ...base, contactAvailable: 0 }))
  })

  it('multiple source mentions increase score', () => {
    const base = { recency: recencyScore(7), sourceConfidence: 0.8, enrichmentComplete: 0.5, hiringSignal: 0.5, contactAvailable: 0 }
    expect(computeScore({ ...base, crossSourceMentions: 4 })).toBeGreaterThan(computeScore({ ...base, crossSourceMentions: 1 }))
  })
})
