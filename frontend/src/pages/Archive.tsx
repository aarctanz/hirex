import { useEffect, useState } from 'react'
import { getArchive } from '@/lib/api'
import DigestCard from '@/components/DigestCard'
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

  if (loading) return <p className="text-muted-foreground">Loading...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Digest Archive</h1>
      <p className="mt-1 text-sm text-muted-foreground">Past weekly digests and all discovered startups.</p>
      {digests.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No digests yet. Check back after the first digest is sent.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {digests.map((d) => (
            <DigestCard key={d.id} digest={d} />
          ))}
        </div>
      )}
    </div>
  )
}
