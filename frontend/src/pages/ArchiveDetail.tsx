import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getArchiveDetail } from '../lib/api'
import StartupCard from '../components/StartupCard'
import type { ArchiveDetailResponse } from '../../../src/types'

export default function ArchiveDetail() {
  const { digestId } = useParams<{ digestId: string }>()
  const [data, setData] = useState<ArchiveDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!digestId) return
    getArchiveDetail(parseInt(digestId, 10))
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [digestId])

  if (loading) return <p className="text-gray-400">Loading…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return null

  const { digest, topItems, otherItems } = data
  const start = new Date(digest.periodStart).toLocaleDateString()
  const end = new Date(digest.periodEnd).toLocaleDateString()

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/archive" className="text-sm text-gray-400 hover:underline mb-4 inline-block">
        ← Archive
      </Link>
      <h1 className="text-2xl font-bold mb-1">{digest.subject}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {start} – {end} · {digest.totalFoundCount} startups found
      </p>

      <h2 className="text-lg font-semibold mb-3">Top {digest.topCount} in this digest</h2>
      <div className="flex flex-col gap-3 mb-8">
        {topItems.map((item) => (
          <StartupCard
            key={item.startup.id}
            startup={item.startup}
            fundingEvent={item.fundingEvent}
            rank={item.rank}
          />
        ))}
      </div>

      {otherItems.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3">
            {otherItems.length} more startups found this period
          </h2>
          <div className="flex flex-col gap-3">
            {otherItems.map((item) => (
              <StartupCard
                key={item.startup.id}
                startup={item.startup}
                fundingEvent={item.fundingEvent}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
