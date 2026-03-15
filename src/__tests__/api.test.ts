import { describe, it, expect } from 'vitest'
import { SELF } from 'cloudflare:test'

describe('GET /api/auth/session', () => {
  it('returns 200 with authenticated: false when no cookie', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/session')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    const body = await res.json() as { authenticated: boolean }
    expect(body.authenticated).toBe(false)
  })
})

describe('POST /api/auth/request-otp', () => {
  it('returns 400 for missing email', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toBeTruthy()
  })

  it('returns 400 for invalid email format', async () => {
    const res = await SELF.fetch('http://example.com/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/subscribe', () => {
  it('returns 401 without session', async () => {
    const res = await SELF.fetch('http://example.com/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(401)
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})

describe('POST /api/unsubscribe', () => {
  it('returns 401 without session', async () => {
    const res = await SELF.fetch('http://example.com/api/unsubscribe', {
      method: 'POST',
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/archive', () => {
  it('returns 401 without session', async () => {
    const res = await SELF.fetch('http://example.com/api/archive')
    expect(res.status).toBe(401)
    expect(res.headers.get('content-type')).toContain('application/json')
  })
})

describe('GET /api/archive/:digestId', () => {
  it('returns 401 without session', async () => {
    const res = await SELF.fetch('http://example.com/api/archive/1')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/startups/:startupId', () => {
  it('returns 401 without session', async () => {
    const res = await SELF.fetch('http://example.com/api/startups/1')
    expect(res.status).toBe(401)
  })
})
