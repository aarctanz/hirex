import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getStartup } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  if (loading) return <p className="text-muted-foreground">Loading...</p>
  if (error) return <p className="text-destructive">{error}</p>
  if (!data) return null

  const { startup, fundingEvent, enrichment } = data

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link to="/archive">
          <ArrowLeft className="mr-1 h-4 w-4" /> Archive
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{startup.canonicalName}</h1>
          <div className="mt-1 flex items-center gap-2">
            {startup.category && <Badge variant="secondary">{startup.category}</Badge>}
            {startup.headquarters && (
              <span className="text-sm text-muted-foreground">{startup.headquarters}</span>
            )}
          </div>
        </div>
        {startup.websiteUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer">
              Website <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </div>

      {fundingEvent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Funding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {fundingEvent.roundType && (
              <p><span className="font-medium">Round:</span> {fundingEvent.roundType}</p>
            )}
            {fundingEvent.amountText && (
              <p><span className="font-medium">Amount:</span> {fundingEvent.amountText}</p>
            )}
            {fundingEvent.announcedAt && (
              <p>
                <span className="font-medium">Announced:</span>{' '}
                {new Date(fundingEvent.announcedAt).toLocaleDateString()}
              </p>
            )}
            {fundingEvent.summary && (
              <p className="text-muted-foreground">{fundingEvent.summary}</p>
            )}
            <a
              href={fundingEvent.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Source: {fundingEvent.sourceName} <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      )}

      {enrichment && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Hiring & Outreach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {enrichment.careersUrl && (
              <p>
                <span className="font-medium">Careers:</span>{' '}
                <a href={enrichment.careersUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {enrichment.careersUrl}
                </a>
              </p>
            )}
            {enrichment.jobsUrl && enrichment.jobsUrl !== enrichment.careersUrl && (
              <p>
                <span className="font-medium">Jobs:</span>{' '}
                <a href={enrichment.jobsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {enrichment.jobsUrl}
                </a>
              </p>
            )}
            {enrichment.publicEmail && (
              <p><span className="font-medium">Public email:</span> {enrichment.publicEmail}</p>
            )}
            {enrichment.bestFirstContactType && (
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <p className="font-medium">Best first contact</p>
                  <p>{enrichment.bestFirstContactType}: {enrichment.bestFirstContactValue}</p>
                  {enrichment.bestFirstContactReason && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{enrichment.bestFirstContactReason}</p>
                  )}
                </CardContent>
              </Card>
            )}
            <p>
              <span className="font-medium">Hiring signal:</span>{' '}
              <Badge variant={enrichment.hiringSignalScore > 0.5 ? 'default' : 'secondary'}>
                {enrichment.hiringSignalScore.toFixed(1)}
              </Badge>
            </p>
            {enrichment.hiringNotes && (
              <p className="text-muted-foreground">{enrichment.hiringNotes}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
