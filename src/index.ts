import { Hono } from 'hono'
import { authRoutes } from './api/auth'
import { subscribeRoutes } from './api/subscribe'
import { archiveRoutes } from './api/archive'
import type { Env } from './env'

export { SourcePollerAgent } from './agents/SourcePollerAgent'
export { FundingExtractionAgent } from './agents/FundingExtractionAgent'
export { StartupEnrichmentAgent } from './agents/StartupEnrichmentAgent'
export { DigestAgent } from './agents/DigestAgent'

const app = new Hono<{ Bindings: Env }>()

app.route('/api/auth', authRoutes)
app.route('/api', subscribeRoutes)
app.route('/api', archiveRoutes)

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === '0 0 * * *') {
      // Trigger SourcePollerAgent
      const id = env.SOURCE_POLLER_AGENT.idFromName('singleton')
      const stub = env.SOURCE_POLLER_AGENT.get(id)
      ctx.waitUntil(stub.fetch(new Request('http://internal/run', { method: 'POST' })))
    } else if (event.cron === '0 9 * * 1') {
      // Trigger DigestAgent
      const id = env.DIGEST_AGENT.idFromName('singleton')
      const stub = env.DIGEST_AGENT.get(id)
      ctx.waitUntil(stub.fetch(new Request('http://internal/run', { method: 'POST' })))
    }
  },

  async queue(batch: MessageBatch, env: Env): Promise<void> {
    if (batch.queue === 'candidate-funding-items') {
      const id = env.FUNDING_EXTRACTION_AGENT.idFromName('singleton')
      const stub = env.FUNDING_EXTRACTION_AGENT.get(id)
      for (const message of batch.messages) {
        await stub.fetch(
          new Request('http://internal/run', {
            method: 'POST',
            body: JSON.stringify(message.body),
          }),
        )
        message.ack()
      }
    } else if (batch.queue === 'startup-enrichment-jobs') {
      const id = env.STARTUP_ENRICHMENT_AGENT.idFromName('singleton')
      const stub = env.STARTUP_ENRICHMENT_AGENT.get(id)
      for (const message of batch.messages) {
        await stub.fetch(
          new Request('http://internal/run', {
            method: 'POST',
            body: JSON.stringify(message.body),
          }),
        )
        message.ack()
      }
    }
  },
}
