import { Link } from 'react-router-dom'
import type { StartupSummary, FundingEventSummary } from '../../../src/types'

interface Props {
  startup: StartupSummary
  fundingEvent: FundingEventSummary | null
  rank?: number
}

export default function StartupCard({ startup, fundingEvent, rank }: Props) {
  return (
    <div className="rounded border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          {rank !== undefined && (
            <span className="text-xs font-medium text-gray-400 mr-2">#{rank}</span>
          )}
          <Link
            to={`/startup/${startup.id}`}
            className="font-semibold hover:underline"
          >
            {startup.canonicalName}
          </Link>
          {startup.category && (
            <span className="ml-2 text-xs text-gray-500">{startup.category}</span>
          )}
        </div>
        {startup.websiteUrl && (
          <a
            href={startup.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            Website ↗
          </a>
        )}
      </div>
      {fundingEvent && (
        <div className="mt-2 text-sm text-gray-600">
          {fundingEvent.roundType && (
            <span className="font-medium">{fundingEvent.roundType}</span>
          )}
          {fundingEvent.amountText && (
            <span> · {fundingEvent.amountText}</span>
          )}
          {fundingEvent.announcedAt && (
            <span className="ml-2 text-gray-400 text-xs">
              {new Date(fundingEvent.announcedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
      {fundingEvent?.summary && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{fundingEvent.summary}</p>
      )}
    </div>
  )
}
