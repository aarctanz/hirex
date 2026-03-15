import type { Context } from 'hono'
import { eq, and, gt } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { sessions, subscribers } from '../db/schema'

export function generateOtp(): string {
  const digits = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return digits.toString().padStart(6, '0')
}

export function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + crypto.randomUUID()
}

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashOtp(otp: string): Promise<string> {
  return sha256Hex(otp)
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  const computed = await sha256Hex(otp)
  return computed === hash
}

export async function hashSessionToken(token: string): Promise<string> {
  return sha256Hex(token)
}

const SESSION_COOKIE = 'hirex_session'
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60

export function setSessionCookie(c: Context<{ Bindings: Env }>, token: string): void {
  const cookieValue = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${THIRTY_DAYS_SECONDS}`,
  ].join('; ')
  c.header('Set-Cookie', cookieValue)
}

export function clearSessionCookie(c: Context<{ Bindings: Env }>): void {
  const cookieValue = [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ].join('; ')
  c.header('Set-Cookie', cookieValue)
}

export function getSessionToken(c: Context<{ Bindings: Env }>): string | null {
  const cookieHeader = c.req.header('Cookie') ?? ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  return match ? match[1] : null
}

export type SessionResult = {
  session: typeof sessions.$inferSelect
  subscriber: typeof subscribers.$inferSelect
}

export async function validateSession(c: Context<{ Bindings: Env }>): Promise<SessionResult | null> {
  const token = getSessionToken(c)
  if (!token) return null

  const db = createDb(c.env.hirex_db)
  const tokenHash = await hashSessionToken(token)
  const now = new Date()

  const result = await db
    .select({ session: sessions, subscriber: subscribers })
    .from(sessions)
    .innerJoin(subscribers, eq(sessions.subscriberId, subscribers.id))
    .where(and(eq(sessions.sessionTokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1)
    .then((rows) => rows[0])

  return result ?? null
}

export async function validateSubscribedSession(c: Context<{ Bindings: Env }>): Promise<SessionResult | null> {
  const result = await validateSession(c)
  if (!result || !result.subscriber.isActive) return null
  return result
}
