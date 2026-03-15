export interface Env {
  hirex_db: D1Database
  candidate_funding_items: Queue
  startup_enrichment_jobs: Queue
  AI: Ai
  RESEND_API_KEY: string
  SESSION_SECRET: string
  SOURCE_POLLER_AGENT: DurableObjectNamespace
  FUNDING_EXTRACTION_AGENT: DurableObjectNamespace
  STARTUP_ENRICHMENT_AGENT: DurableObjectNamespace
  DIGEST_AGENT: DurableObjectNamespace
}
