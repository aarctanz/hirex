import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { subscribers } from '../db/schema'
import { validateSession } from '../lib/auth'
import { sendWelcomeEmail } from '../lib/email'
import type { SubscriptionStatusResponse } from '../types'

export const subscribeRoutes = new Hono<{ Bindings: Env }>()

subscribeRoutes.post('/subscribe', async (c) => {
  const auth = await validateSession(c)
  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  const db = createDb(c.env.DB)
  const now = new Date()
  const { subscriber } = auth

  if (subscriber.isActive) {
    return c.json({ ok: true, message: 'Already subscribed' })
  }

  await db
    .update(subscribers)
    .set({ isActive: true, subscribedAt: now, unsubscribedAt: null })
    .where(eq(subscribers.id, subscriber.id))

  if (!subscriber.welcomeEmailSentAt) {
    await sendWelcomeEmail(c.env, subscriber.email)
    await db
      .update(subscribers)
      .set({ welcomeEmailSentAt: now })
      .where(eq(subscribers.id, subscriber.id))
  }

  return c.json({ ok: true })
})

subscribeRoutes.post('/unsubscribe', async (c) => {
  const auth = await validateSession(c)
  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  const db = createDb(c.env.DB)
  await db
    .update(subscribers)
    .set({ isActive: false, unsubscribedAt: new Date() })
    .where(eq(subscribers.id, auth.subscriber.id))

  return c.json({ ok: true })
})

subscribeRoutes.get('/subscription/status', async (c) => {
  const auth = await validateSession(c)
  if (!auth) {
    return c.json<SubscriptionStatusResponse>({ subscribed: false, email: null })
  }

  return c.json<SubscriptionStatusResponse>({
    subscribed: auth.subscriber.isActive,
    email: auth.subscriber.email,
  })
})
