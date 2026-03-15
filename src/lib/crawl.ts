/**
 * Simple web crawling helpers using plain fetch.
 */

import { stripHtml } from './extraction'

const FETCH_TIMEOUT = 10_000
const USER_AGENT = 'HIREX/1.0 (Funding Tracker)'

export async function fetchPage(url: string): Promise<{ html: string; text: string } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok) return null
    const html = await res.text()
    return { html, text: stripHtml(html) }
  } catch {
    return null
  }
}

export async function findSubpages(
  baseUrl: string,
  paths: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>()
  const base = baseUrl.replace(/\/$/, '')

  const results = await Promise.allSettled(
    paths.map(async (path) => {
      const url = `${base}${path}`
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      }).catch(() => null)
      if (res && res.ok) {
        found.set(path, res.url)
      }
    }),
  )
  void results

  return found
}

export function extractEmails(text: string): string[] {
  const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(pattern) ?? []
  // Filter out common false positives
  return [...new Set(matches)].filter(
    (e) =>
      !e.endsWith('.png') &&
      !e.endsWith('.jpg') &&
      !e.endsWith('.svg') &&
      !e.includes('example.com') &&
      !e.includes('sentry.io') &&
      !e.includes('webpack'),
  )
}

export function extractSocialLinks(html: string): Array<{ url: string; platform: string }> {
  const links: Array<{ url: string; platform: string }> = []
  const urlPattern = /https?:\/\/[^\s"'<>]+/g
  const urls = html.match(urlPattern) ?? []

  for (const url of urls) {
    if (url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/')) {
      links.push({ url, platform: 'linkedin' })
    } else if (url.includes('twitter.com/') || url.includes('x.com/')) {
      links.push({ url, platform: 'twitter' })
    } else if (url.includes('github.com/')) {
      links.push({ url, platform: 'github' })
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  return links.filter((l) => {
    if (seen.has(l.url)) return false
    seen.add(l.url)
    return true
  })
}

export async function searchDuckDuckGo(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}
