import { describe, it, expect } from 'vitest'
import { extractFundingFromText, isFundingRelated, stripHtml } from '../lib/extraction'

describe('extractFundingFromText', () => {
  it('extracts startup name and amount from typical title', () => {
    const result = extractFundingFromText(
      'Acme Corp raises $10 million in Series A',
      'Acme Corp, a startup building widgets, has raised $10 million in a Series A round.',
    )
    expect(result.startupName).toBe('Acme Corp')
    expect(result.amountText).toContain('10')
    expect(result.amountValueUsd).toBe(10_000_000)
    expect(result.roundType).toBe('Series A')
    expect(result.confidenceScore).toBeGreaterThan(0.5)
  })

  it('extracts billion-scale amounts', () => {
    const result = extractFundingFromText(
      'MegaTech secures $2.5 billion',
      'MegaTech has secured $2.5 billion in growth funding.',
    )
    expect(result.amountValueUsd).toBe(2_500_000_000)
  })

  it('returns low confidence for non-funding articles', () => {
    const result = extractFundingFromText(
      'Company launches new product feature',
      'Today we are excited to announce our latest product update.',
    )
    expect(result.confidenceScore).toBeLessThan(0.2)
    expect(result.startupName).toBeNull()
  })

  it('handles Seed round', () => {
    const result = extractFundingFromText(
      'StartupXYZ closes $3M Seed round',
      '',
    )
    expect(result.roundType).toBe('Seed')
    expect(result.amountText).toContain('3')
  })
})

describe('isFundingRelated', () => {
  it('returns true for funding titles', () => {
    expect(isFundingRelated('Acme raises $5 million in Series A')).toBe(true)
    expect(isFundingRelated('Startup secures seed funding')).toBe(true)
    expect(isFundingRelated('YC-backed company raises $2M')).toBe(true)
  })

  it('returns false for non-funding titles', () => {
    expect(isFundingRelated('How to build a better product')).toBe(false)
    expect(isFundingRelated('New JavaScript framework released')).toBe(false)
  })
})

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })

  it('removes script and style tags with content', () => {
    expect(stripHtml('<script>alert("xss")</script>text')).toBe('text')
    expect(stripHtml('<style>.foo{}</style>text')).toBe('text')
  })

  it('decodes HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt; &quot;')).toBe('& < > "')
  })
})
