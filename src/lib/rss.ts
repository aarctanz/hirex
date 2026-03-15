/**
 * Minimal RSS/Atom parser for Workers runtime (no Node.js dependencies).
 * Handles RSS 2.0 and Atom feed formats.
 */

export interface FeedItem {
  title: string
  url: string
  guid: string
  publishedAt: string | null
}

export async function fetchAndParseRss(url: string): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HIREX/1.0 (Funding Tracker)' },
  })
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`)
  const xml = await res.text()
  return parseRssXml(xml)
}

export function parseRssXml(xml: string): FeedItem[] {
  const items: FeedItem[] = []

  // Try RSS 2.0 format (<item> elements)
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  for (const itemXml of rssItems) {
    const title = extractTag(itemXml, 'title')
    const link = extractTag(itemXml, 'link')
    const guid = extractTag(itemXml, 'guid') ?? link
    const pubDate = extractTag(itemXml, 'pubDate')

    if (title && link && guid) {
      items.push({ title, url: link, guid, publishedAt: pubDate ? normalizeDate(pubDate) : null })
    }
  }

  // Try Atom format (<entry> elements) if no RSS items found
  if (items.length === 0) {
    const entries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
    for (const entryXml of entries) {
      const title = extractTag(entryXml, 'title')
      const link = extractAtomLink(entryXml)
      const id = extractTag(entryXml, 'id') ?? link
      const published = extractTag(entryXml, 'published') ?? extractTag(entryXml, 'updated')

      if (title && link && id) {
        items.push({ title, url: link, guid: id, publishedAt: published ? normalizeDate(published) : null })
      }
    }
  }

  return items
}

function extractTag(xml: string, tag: string): string | null {
  // Handle both <tag>content</tag> and <tag><![CDATA[content]]></tag>
  const pattern = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 'is')
  const match = pattern.exec(xml)
  if (!match) return null
  return decodeXmlEntities(match[1].trim())
}

function extractAtomLink(xml: string): string | null {
  // Atom links: <link href="..." rel="alternate" />
  const altMatch = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  if (altMatch) return altMatch[1]
  // Fallback: first link with href
  const hrefMatch = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  return hrefMatch ? hrefMatch[1] : null
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function normalizeDate(dateStr: string): string | null {
  try {
    return new Date(dateStr).toISOString()
  } catch {
    return null
  }
}
