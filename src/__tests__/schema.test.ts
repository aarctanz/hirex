import { describe, it, expect } from 'vitest'
import {
  sources,
  rawItems,
  startups,
  fundingEvents,
  startupEnrichment,
  subscribers,
  authOtps,
  sessions,
  digests,
  digestItems,
} from '../db/schema'

describe('Drizzle schema', () => {
  it('exports all 10 table objects', () => {
    const tables = [
      sources,
      rawItems,
      startups,
      fundingEvents,
      startupEnrichment,
      subscribers,
      authOtps,
      sessions,
      digests,
      digestItems,
    ]
    expect(tables).toHaveLength(10)
    for (const table of tables) {
      expect(table).toBeDefined()
    }
  })

  it('sources table has expected column names', () => {
    expect(sources.name.name).toBe('name')
    expect(sources.url.name).toBe('url')
    expect(sources.enabled.name).toBe('enabled')
  })

  it('sessions table has session_token_hash column', () => {
    expect(sessions.sessionTokenHash.name).toBe('session_token_hash')
  })

  it('subscribers table has email column', () => {
    expect(subscribers.email.name).toBe('email')
  })

  it('digest_items table has included_in_email column', () => {
    expect(digestItems.includedInEmail.name).toBe('included_in_email')
  })
})
