import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getArchiveDetail } from '@/lib/api'
import { Button } from '@/components/ui/button'
import StartupCard from '@/components/StartupCard'
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

  if (loading) return <p className="text-muted-foreground">Loading...</p>
  if (error) return <p className="text-destructive">{error}</p>
  if (!data) return null

  const { digest, topItems, otherItems } = data
  const start = new Date(digest.periodStart).toLocaleDateString()
  const end = new Date(digest.periodEnd).toLocaleDateString()

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link to="/archive">
          <ArrowLeft className="mr-1 h-4 w-4" /> Archive
        </Link>
      </Button>
      <h1 className="text-2xl font-bold">{digest.subject}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {start} &ndash; {end} &middot; {digest.totalFoundCount} startups found
      </p>

      <h2 className="mt-8 text-lg font-semibold">Top {digest.topCount} in this digest</h2>
      <div className="mt-3 flex flex-col gap-3">
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
          <h2 className="mt-8 text-lg font-semibold">
            {otherItems.length} more startups found this period
          </h2>
          <div className="mt-3 flex flex-col gap-3">
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
