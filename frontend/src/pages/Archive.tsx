import { useEffect, useState } from 'react'
import { getArchive } from '../lib/api'
import DigestCard from '../components/DigestCard'
import type { DigestSummary } from '../../../src/types'

export default function Archive() {
  const [digests, setDigests] = useState<DigestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getArchive()
      .then((data) => setDigests(data.digests))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-400">Loading…</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Digest Archive</h1>
      {digests.length === 0 ? (
        <p className="text-gray-500">No digests yet. Check back after the first digest is sent.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {digests.map((d) => (
            <DigestCard key={d.id} digest={d} />
          ))}
        </div>
      )}
    </div>
  )
}
