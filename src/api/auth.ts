import { Hono } from 'hono'
import { eq, and, gt } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { authOtps, sessions, subscribers } from '../db/schema'
import {
  generateOtp,
  generateSessionToken,
  hashOtp,
  verifyOtp,
  hashSessionToken,
  setSessionCookie,
  clearSessionCookie,
  validateSession,
} from '../lib/auth'
import { sendOtpEmail } from '../lib/email'
import type { SessionResponse } from '../types'

export const authRoutes = new Hono<{ Bindings: Env }>()

const OTP_EXPIRY_MINUTES = 10
const OTP_RATE_LIMIT_MINUTES = 1

authRoutes.post('/request-otp', async (c) => {
  let email: string | undefined
  try {
    const body = await c.req.json<{ email?: string }>()
    email = body.email?.trim().toLowerCase()
  } catch {
    return c.json({ error: 'Invalid request body' }, 400)
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Invalid email address' }, 400)
  }

  const db = createDb(c.env.hirex_db)
  const now = new Date()

  // Rate limit: one OTP per minute per email
  const recent = await db
    .select()
    .from(authOtps)
    .where(
      and(
        eq(authOtps.email, email),
        gt(authOtps.lastSentAt, new Date(now.getTime() - OTP_RATE_LIMIT_MINUTES * 60 * 1000)),
      ),
    )
    .limit(1)

  if (recent.length > 0) {
    return c.json({ error: 'Please wait before requesting another code' }, 429)
  }

  const otp = generateOtp()
  const otpHash = await hashOtp(otp)
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await db.insert(authOtps).values({
    email,
    otpHash,
    expiresAt,
    attemptCount: 0,
    maxAttempts: 5,
    lastSentAt: now,
  })

  await sendOtpEmail(c.env, email, otp)

  return c.json({ ok: true })
})

authRoutes.post('/verify-otp', async (c) => {
  let email: string | undefined
  let otp: string | undefined
  try {
    const body = await c.req.json<{ email?: string; otp?: string }>()
    email = body.email?.trim().toLowerCase()
    otp = body.otp?.trim()
  } catch {
    return c.json({ error: 'Invalid request body' }, 400)
  }

  if (!email || !otp) {
    return c.json({ error: 'Email and OTP are required' }, 400)
  }

  const db = createDb(c.env.hirex_db)
  const now = new Date()

  const record = await db
    .select()
    .from(authOtps)
    .where(and(eq(authOtps.email, email), gt(authOtps.expiresAt, now)))
    .orderBy(authOtps.createdAt)
    .limit(1)
    .then((rows) => rows[0])

  if (!record) {
    return c.json({ error: 'No valid OTP found. Please request a new code.' }, 400)
  }

  if (record.attemptCount >= record.maxAttempts) {
    return c.json({ error: 'Too many attempts. Please request a new code.' }, 429)
  }

  await db
    .update(authOtps)
    .set({ attemptCount: record.attemptCount + 1 })
    .where(eq(authOtps.id, record.id))

  const valid = await verifyOtp(otp, record.otpHash)
  if (!valid) {
    return c.json({ error: 'Invalid code' }, 400)
  }

  let subscriber = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1)
    .then((rows) => rows[0])

  if (!subscriber) {
    const inserted = await db
      .insert(subscribers)
      .values({ email })
      .returning()
    subscriber = inserted[0]
  }

  const token = generateSessionToken()
  const tokenHash = await hashSessionToken(token)
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await db.insert(sessions).values({
    subscriberId: subscriber.id,
    sessionTokenHash: tokenHash,
    expiresAt,
    lastSeenAt: now,
  })

  setSessionCookie(c, token)
  return c.json({ ok: true })
})

authRoutes.post('/logout', async (c) => {
  const auth = await validateSession(c)
  if (auth) {
    const db = createDb(c.env.hirex_db)
    await db.delete(sessions).where(eq(sessions.id, auth.session.id))
  }
  clearSessionCookie(c)
  return c.json({ ok: true })
})

authRoutes.get('/session', async (c) => {
  const auth = await validateSession(c)
  if (!auth) {
    clearSessionCookie(c)
    return c.json<SessionResponse>({ authenticated: false, subscribed: false, email: null })
  }

  const db = createDb(c.env.hirex_db)
  await db
    .update(sessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessions.id, auth.session.id))

  return c.json<SessionResponse>({
    authenticated: true,
    subscribed: auth.subscriber.isActive,
    email: auth.subscriber.email,
  })
})
