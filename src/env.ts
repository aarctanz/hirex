export interface Env {
  DB: D1Database
  CANDIDATE_FUNDING_QUEUE: Queue
  STARTUP_ENRICHMENT_QUEUE: Queue
  BROWSER: Fetcher
  RESEND_API_KEY: string
  SESSION_SECRET: string
  SOURCE_POLLER_AGENT: DurableObjectNamespace
  FUNDING_EXTRACTION_AGENT: DurableObjectNamespace
  STARTUP_ENRICHMENT_AGENT: DurableObjectNamespace
  DIGEST_AGENT: DurableObjectNamespace
}
