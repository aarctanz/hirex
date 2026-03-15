import { Agent } from '@cloudflare/agents'
import { eq } from 'drizzle-orm'
import type { Env } from '../env'
import { createDb } from '../db'
import { startups, startupEnrichment } from '../db/schema'
import { fetchPage, findSubpages, extractEmails, extractSocialLinks, searchDuckDuckGo } from '../lib/crawl'
import { extractEnrichmentWithAi } from '../lib/ai'
import { stripHtml } from '../lib/extraction'

const SUBPAGE_PATHS = [
  '/careers', '/jobs', '/contact', '/about', '/team',
  '/hiring', '/work-with-us', '/join', '/open-positions',
]

/**
 * StartupEnrichmentAgent — enriches startup records with hiring and contact signals.
 *
 * Approach:
 * 1. Crawl the startup's own website for careers/jobs/contact/team pages
 * 2. Search externally (DuckDuckGo) for founder profiles and additional info
 * 3. Use Workers AI to extract structured contact/team data from crawled pages
 *
 * Triggered by: queue consumer for `startup-enrichment-jobs`.
 */
export class StartupEnrichmentAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const body = await request.json().catch(() => null) as { startupId?: number } | null
    if (!body?.startupId) {
      return Response.json({ error: 'Missing startupId' }, { status: 400 })
    }

    const db = createDb(this.env.hirex_db)

    const startup = await db
      .select()
      .from(startups)
      .where(eq(startups.id, body.startupId))
      .limit(1)
      .then((rows) => rows[0])

    if (!startup) {
      return Response.json({ error: 'Startup not found' }, { status: 404 })
    }

    try {
      // Resolve website URL if not set
      let websiteUrl = startup.websiteUrl
      if (!websiteUrl && startup.domain) {
        websiteUrl = `https://${startup.domain}`
        const page = await fetchPage(websiteUrl)
        if (!page) websiteUrl = null
      }
      if (!websiteUrl) {
        // Try searching for the company website
        const searchHtml = await searchDuckDuckGo(`${startup.canonicalName} official website`)
        const urlMatch = searchHtml.match(/https?:\/\/(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i)
        if (urlMatch) {
          websiteUrl = urlMatch[0]
        }
      }

      // Update startup website if found
      if (websiteUrl && !startup.websiteUrl) {
        const domain = new URL(websiteUrl).hostname.replace(/^www\./, '')
        await db.update(startups).set({ websiteUrl, domain, updatedAt: new Date() }).where(eq(startups.id, startup.id))
      }

      // Find subpages on the website
      let careersUrl: string | null = null
      let jobsUrl: string | null = null
      let contactPageUrl: string | null = null

      if (websiteUrl) {
        const subpages = await findSubpages(websiteUrl, SUBPAGE_PATHS)

        for (const [path, url] of subpages) {
          if (['/careers', '/hiring', '/work-with-us', '/join', '/open-positions'].includes(path)) {
            careersUrl = careersUrl ?? url
          }
          if (path === '/jobs') jobsUrl = url
          if (path === '/contact') contactPageUrl = url
        }
      }

      // Crawl about/team page for emails and social links
      let publicEmail: string | null = null
      let allSocialLinks: Array<{ url: string; platform: string }> = []
      let crawledText = ''

      const pagesToCrawl = [websiteUrl, careersUrl, contactPageUrl].filter(Boolean) as string[]
      // Also try /about and /team
      if (websiteUrl) {
        pagesToCrawl.push(`${websiteUrl.replace(/\/$/, '')}/about`)
        pagesToCrawl.push(`${websiteUrl.replace(/\/$/, '')}/team`)
      }

      for (const url of [...new Set(pagesToCrawl)]) {
        const page = await fetchPage(url)
        if (!page) continue

        crawledText += `\n${page.text}`

        const emails = extractEmails(page.text)
        if (emails.length > 0 && !publicEmail) {
          publicEmail = emails[0]
        }

        allSocialLinks = allSocialLinks.concat(extractSocialLinks(page.html))
      }

      // External search for founder/exec profiles
      const searchHtml = await searchDuckDuckGo(`${startup.canonicalName} founders LinkedIn`)
      const externalLinks = extractSocialLinks(searchHtml)
      allSocialLinks = allSocialLinks.concat(externalLinks)

      // Deduplicate social links
      const seen = new Set<string>()
      allSocialLinks = allSocialLinks.filter((l) => {
        if (seen.has(l.url)) return false
        seen.add(l.url)
        return true
      })

      // Use AI to extract structured data from crawled pages
      const aiResult = await extractEnrichmentWithAi(this.env, crawledText, startup.canonicalName)

      // Merge AI results with crawled data
      if (!publicEmail && aiResult.publicEmail) publicEmail = aiResult.publicEmail

      const founderProfiles = aiResult.founderProfiles.length > 0
        ? aiResult.founderProfiles
        : allSocialLinks.filter((l) => l.platform === 'linkedin').slice(0, 5).map((l) => ({ name: '', url: l.url, platform: l.platform }))

      const executiveProfiles = aiResult.executiveProfiles.length > 0
        ? aiResult.executiveProfiles
        : []

      // Compute hiring signal score
      let hiringSignalScore = 0
      if (careersUrl) hiringSignalScore += 0.35
      if (jobsUrl) hiringSignalScore += 0.25
      if (publicEmail) hiringSignalScore += 0.1
      if (founderProfiles.length > 0) hiringSignalScore += 0.15
      if (aiResult.hiringNotes?.toLowerCase().includes('hiring')) hiringSignalScore += 0.15

      // Determine best first contact
      let bestFirstContactType: string | null = null
      let bestFirstContactValue: string | null = null
      let bestFirstContactReason: string | null = null

      if (careersUrl) {
        bestFirstContactType = 'careers_page'
        bestFirstContactValue = careersUrl
        bestFirstContactReason = 'Company has an active careers page — apply directly'
      } else if (publicEmail) {
        bestFirstContactType = 'email'
        bestFirstContactValue = publicEmail
        bestFirstContactReason = 'Public contact email available'
      } else if (founderProfiles.length > 0) {
        bestFirstContactType = 'social_profile'
        bestFirstContactValue = founderProfiles[0].url
        bestFirstContactReason = `Reach out to founder via ${founderProfiles[0].platform}`
      } else if (contactPageUrl) {
        bestFirstContactType = 'contact_page'
        bestFirstContactValue = contactPageUrl
        bestFirstContactReason = 'Use the company contact page'
      }

      // Upsert enrichment record
      const existing = await db
        .select()
        .from(startupEnrichment)
        .where(eq(startupEnrichment.startupId, startup.id))
        .limit(1)
        .then((rows) => rows[0])

      const enrichmentData = {
        startupId: startup.id,
        careersUrl,
        jobsUrl,
        publicEmail,
        contactPageUrl,
        founderProfilesJson: JSON.stringify(founderProfiles),
        executiveProfilesJson: JSON.stringify(executiveProfiles),
        hiringManagerProfilesJson: null as string | null,
        bestFirstContactType,
        bestFirstContactValue,
        bestFirstContactReason,
        hiringSignalScore,
        hiringNotes: aiResult.hiringNotes,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      }

      if (existing) {
        await db.update(startupEnrichment).set(enrichmentData).where(eq(startupEnrichment.id, existing.id))
      } else {
        await db.insert(startupEnrichment).values(enrichmentData)
      }

      return Response.json({ ok: true, startupId: startup.id, hiringSignalScore })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return Response.json({ error: msg }, { status: 500 })
    }
  }
}
