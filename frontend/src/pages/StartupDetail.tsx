import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStartup } from '../lib/api'
import type { StartupDetailResponse } from '../../../src/types'

export default function StartupDetail() {
  const { startupId } = useParams<{ startupId: string }>()
  const [data, setData] = useState<StartupDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!startupId) return
    getStartup(parseInt(startupId, 10))
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [startupId])

  if (loading) return <p className="text-gray-400">Loading…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return null

  const { startup, fundingEvent, enrichment } = data

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/archive" className="text-sm text-gray-400 hover:underline mb-4 inline-block">
        ← Archive
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{startup.canonicalName}</h1>
          {startup.category && (
            <p className="text-sm text-gray-500 mt-0.5">{startup.category}</p>
          )}
          {startup.headquarters && (
            <p className="text-sm text-gray-400">{startup.headquarters}</p>
          )}
        </div>
        {startup.websiteUrl && (
          <a
            href={startup.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline shrink-0"
          >
            Website ↗
          </a>
        )}
      </div>

      {fundingEvent && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Funding</h2>
          <div className="rounded border p-4 text-sm space-y-1">
            {fundingEvent.roundType && <p><span className="font-medium">Round:</span> {fundingEvent.roundType}</p>}
            {fundingEvent.amountText && <p><span className="font-medium">Amount:</span> {fundingEvent.amountText}</p>}
            {fundingEvent.announcedAt && (
              <p><span className="font-medium">Announced:</span> {new Date(fundingEvent.announcedAt).toLocaleDateString()}</p>
            )}
            {fundingEvent.summary && <p className="text-gray-600 pt-1">{fundingEvent.summary}</p>}
            <a
              href={fundingEvent.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              Source: {fundingEvent.sourceName} ↗
            </a>
          </div>
        </section>
      )}

      {enrichment && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Hiring & Outreach</h2>
          <div className="rounded border p-4 text-sm space-y-2">
            {enrichment.careersUrl && (
              <p>
                <span className="font-medium">Careers:</span>{' '}
                <a href={enrichment.careersUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {enrichment.careersUrl} ↗
                </a>
              </p>
            )}
            {enrichment.jobsUrl && enrichment.jobsUrl !== enrichment.careersUrl && (
              <p>
                <span className="font-medium">Jobs:</span>{' '}
                <a href={enrichment.jobsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {enrichment.jobsUrl} ↗
                </a>
              </p>
            )}
            {enrichment.publicEmail && (
              <p><span className="font-medium">Public email:</span> {enrichment.publicEmail}</p>
            )}
            {enrichment.bestFirstContactType && (
              <div className="bg-gray-50 rounded p-3">
                <p className="font-medium">Best first contact</p>
                <p>{enrichment.bestFirstContactType}: {enrichment.bestFirstContactValue}</p>
                {enrichment.bestFirstContactReason && (
                  <p className="text-gray-500 text-xs mt-0.5">{enrichment.bestFirstContactReason}</p>
                )}
              </div>
            )}
            <p>
              <span className="font-medium">Hiring signal score:</span>{' '}
              {enrichment.hiringSignalScore.toFixed(1)}
            </p>
            {enrichment.hiringNotes && (
              <p className="text-gray-600">{enrichment.hiringNotes}</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
