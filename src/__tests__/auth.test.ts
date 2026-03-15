import { describe, it, expect } from 'vitest'
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  generateSessionToken,
  hashSessionToken,
} from '../lib/auth'

describe('generateOtp', () => {
  it('returns a 6-character string', () => {
    const otp = generateOtp()
    expect(otp).toHaveLength(6)
  })

  it('contains only digits', () => {
    const otp = generateOtp()
    expect(/^\d{6}$/.test(otp)).toBe(true)
  })

  it('produces different values on consecutive calls', () => {
    const results = new Set(Array.from({ length: 20 }, () => generateOtp()))
    expect(results.size).toBeGreaterThan(1)
  })
})

describe('hashOtp / verifyOtp', () => {
  it('round-trips correctly', async () => {
    const otp = '123456'
    const hash = await hashOtp(otp)
    expect(await verifyOtp(otp, hash)).toBe(true)
  })

  it('returns false for wrong otp', async () => {
    const hash = await hashOtp('123456')
    expect(await verifyOtp('654321', hash)).toBe(false)
  })

  it('hash is a hex string of length 64', async () => {
    const hash = await hashOtp('000000')
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true)
  })
})

describe('generateSessionToken', () => {
  it('returns a non-empty string', () => {
    const token = generateSessionToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('produces different values on consecutive calls', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateSessionToken()))
    expect(tokens.size).toBe(10)
  })
})

describe('hashSessionToken', () => {
  it('produces consistent output for same input', async () => {
    const token = 'some-test-token'
    const h1 = await hashSessionToken(token)
    const h2 = await hashSessionToken(token)
    expect(h1).toBe(h2)
  })

  it('produces different hashes for different tokens', async () => {
    const h1 = await hashSessionToken('token-a')
    const h2 = await hashSessionToken('token-b')
    expect(h1).not.toBe(h2)
  })
})
