import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import type { DigestSummary } from '../../../src/types'

interface Props {
  digest: DigestSummary
}

export default function DigestCard({ digest }: Props) {
  const start = new Date(digest.periodStart).toLocaleDateString()
  const end = new Date(digest.periodEnd).toLocaleDateString()

  return (
    <Card>
      <CardContent className="p-4">
        <Link to={`/archive/${digest.id}`} className="font-semibold hover:underline">
          {digest.subject}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          {start} &ndash; {end}
        </p>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>{digest.topCount} featured</span>
          <span>{digest.totalFoundCount} total found</span>
        </div>
      </CardContent>
    </Card>
  )
}
