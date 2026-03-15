import { describe, it, expect } from 'vitest'
import { parseRssXml } from '../lib/rss'

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Acme raises $10M in Series A</title>
      <link>https://example.com/acme-funding</link>
      <guid>https://example.com/acme-funding</guid>
      <pubDate>Mon, 10 Mar 2025 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title><![CDATA[WidgetCo secures $5 million seed round]]></title>
      <link>https://example.com/widgetco</link>
      <guid>widgetco-123</guid>
      <pubDate>Sun, 09 Mar 2025 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

const ATOM_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <entry>
    <title>FooBar gets $20M funding</title>
    <link href="https://example.com/foobar" rel="alternate" />
    <id>urn:uuid:foobar-1</id>
    <published>2025-03-10T10:00:00Z</published>
  </entry>
</feed>`

describe('parseRssXml', () => {
  it('parses RSS 2.0 items', () => {
    const items = parseRssXml(RSS_SAMPLE)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('Acme raises $10M in Series A')
    expect(items[0].url).toBe('https://example.com/acme-funding')
    expect(items[0].publishedAt).toBeTruthy()
  })

  it('handles CDATA in titles', () => {
    const items = parseRssXml(RSS_SAMPLE)
    expect(items[1].title).toBe('WidgetCo secures $5 million seed round')
  })

  it('parses Atom feed entries', () => {
    const items = parseRssXml(ATOM_SAMPLE)
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('FooBar gets $20M funding')
    expect(items[0].url).toBe('https://example.com/foobar')
    expect(items[0].guid).toBe('urn:uuid:foobar-1')
  })

  it('returns empty array for invalid XML', () => {
    expect(parseRssXml('not xml at all')).toEqual([])
  })
})
