import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { StartupSummary, FundingEventSummary } from '../../../src/types'

interface Props {
  startup: StartupSummary
  fundingEvent: FundingEventSummary | null
  rank?: number
}

export default function StartupCard({ startup, fundingEvent, rank }: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {rank !== undefined && (
              <span className="text-xs font-medium text-muted-foreground">#{rank}</span>
            )}
            <Link to={`/startup/${startup.id}`} className="font-semibold hover:underline">
              {startup.canonicalName}
            </Link>
            {startup.category && (
              <Badge variant="secondary">{startup.category}</Badge>
            )}
          </div>
          {startup.websiteUrl && (
            <a
              href={startup.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        {fundingEvent && (
          <div className="mt-2 text-sm text-muted-foreground">
            {fundingEvent.roundType && (
              <span className="font-medium text-foreground">{fundingEvent.roundType}</span>
            )}
            {fundingEvent.amountText && <span> &middot; {fundingEvent.amountText}</span>}
            {fundingEvent.announcedAt && (
              <span className="ml-2 text-xs">
                {new Date(fundingEvent.announcedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
        {fundingEvent?.summary && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{fundingEvent.summary}</p>
        )}
      </CardContent>
    </Card>
  )
}
