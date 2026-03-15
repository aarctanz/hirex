import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { subscribe } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Subscribe() {
  const { authenticated, subscribed, refresh } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-sm py-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Subscribe to HIREX</CardTitle>
            <CardDescription>You need to be logged in to subscribe.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/login">Login first</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (subscribed || done) {
    return (
      <div className="mx-auto max-w-sm py-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>You're subscribed!</CardTitle>
            <CardDescription>
              You'll receive the weekly HIREX digest. Check your inbox for a welcome email.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/archive')}>Browse Archive</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubscribe = async () => {
    setError(null)
    setLoading(true)
    try {
      await subscribe()
      refresh()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm py-20">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Subscribe to HIREX</CardTitle>
          <CardDescription>
            Receive the top 10 recently funded startups with hiring signals and contact
            info &mdash; weekly, to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleSubscribe} disabled={loading}>
            {loading ? 'Subscribing...' : 'Subscribe Free'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
