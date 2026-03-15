/**
 * Rule-based heuristic extraction for funding data from article text.
 * Returns partial results — gaps are filled by Workers AI in FundingExtractionAgent.
 */

export interface ExtractedFunding {
  startupName: string | null
  roundType: string | null
  amountText: string | null
  amountValueUsd: number | null
  summary: string | null
  confidenceScore: number
}

const ROUND_TYPES = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D',
  'Series E', 'Series F', 'Series G', 'Series H',
  'Bridge', 'Growth', 'Extension', 'Debt', 'IPO',
] as const

const AMOUNT_PATTERN = /\$\s*([\d,.]+)\s*(million|billion|m|b|mn|bn|k|thousand)/gi
const ROUND_PATTERN = new RegExp(`(${ROUND_TYPES.join('|')})(?:\\s+round)?`, 'gi')
const RAISES_PATTERN = /(?:raised?|secures?|closes?|announces?|lands?|gets?)\s+\$\s*([\d,.]+)\s*(million|billion|m|b|mn|bn)/gi

function normalizeAmount(value: string, unit: string): number {
  const num = parseFloat(value.replace(/,/g, ''))
  const u = unit.toLowerCase()
  if (u === 'billion' || u === 'b' || u === 'bn') return num * 1_000_000_000
  if (u === 'million' || u === 'm' || u === 'mn') return num * 1_000_000
  if (u === 'thousand' || u === 'k') return num * 1_000
  return num
}

export function extractFundingFromText(title: string, body: string): ExtractedFunding {
  const text = `${title}\n${body}`
  let confidence = 0

  // Extract amount
  let amountText: string | null = null
  let amountValueUsd: number | null = null
  const amountMatch = AMOUNT_PATTERN.exec(text)
  if (amountMatch) {
    amountText = amountMatch[0].trim()
    amountValueUsd = normalizeAmount(amountMatch[1], amountMatch[2])
    confidence += 0.25
  }

  // Extract round type
  let roundType: string | null = null
  const roundMatch = ROUND_PATTERN.exec(text)
  if (roundMatch) {
    roundType = roundMatch[1]
    confidence += 0.2
  }

  // Check for "raises" verb pattern (strong funding signal)
  RAISES_PATTERN.lastIndex = 0
  if (RAISES_PATTERN.test(text)) {
    confidence += 0.25
  }

  // Try to extract startup name from title
  // Pattern: "CompanyName raises $X" or "CompanyName announces Series A"
  let startupName: string | null = null
  const namePatterns = [
    /^(.+?)\s+(?:raises?|secures?|closes?|announces?|lands?|gets?)\s/i,
    /^(.+?)\s+(?:Series\s+[A-H]|Seed|Pre-Seed)/i,
  ]
  for (const pattern of namePatterns) {
    const match = pattern.exec(title)
    if (match) {
      startupName = match[1].replace(/^["']|["']$/g, '').trim()
      if (startupName.length > 0 && startupName.length < 60) {
        confidence += 0.15
        break
      }
      startupName = null
    }
  }

  // Generate summary from title
  const summary = title.length > 10 ? title : null

  // Clamp confidence
  confidence = Math.min(confidence, 1)

  return { startupName, roundType, amountText, amountValueUsd, summary, confidenceScore: confidence }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function isFundingRelated(title: string): boolean {
  const lower = title.toLowerCase()
  const keywords = [
    'raises', 'raised', 'funding', 'series a', 'series b', 'series c',
    'series d', 'series e', 'seed round', 'pre-seed', 'venture',
    'secures', 'closes', 'million', 'billion', 'valuation',
    'investment', 'backed', 'capital', 'fundraise', 'round',
  ]
  return keywords.some((kw) => lower.includes(kw))
}
