import { Link } from 'react-router-dom'
import type { DigestSummary } from '../../../src/types'

interface Props {
  digest: DigestSummary
}

export default function DigestCard({ digest }: Props) {
  const start = new Date(digest.periodStart).toLocaleDateString()
  const end = new Date(digest.periodEnd).toLocaleDateString()

  return (
    <div className="rounded border p-4 hover:shadow-sm transition-shadow">
      <Link to={`/archive/${digest.id}`} className="font-semibold hover:underline">
        {digest.subject}
      </Link>
      <p className="mt-1 text-sm text-gray-500">
        {start} – {end}
      </p>
      <div className="mt-2 flex gap-4 text-xs text-gray-400">
        <span>{digest.topCount} featured</span>
        <span>{digest.totalFoundCount} total found</span>
      </div>
    </div>
  )
}
