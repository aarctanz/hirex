import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscribe } from '../lib/api'

export default function Subscribe() {
  const { authenticated, subscribed, refresh } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Subscribe to HIREX</h1>
        <p className="text-gray-600 mb-6">
          You need to be logged in to subscribe.
        </p>
        <Link
          to="/login"
          className="rounded bg-black px-6 py-2.5 text-white font-medium hover:bg-gray-800"
        >
          Login first
        </Link>
      </div>
    )
  }

  if (subscribed || done) {
    return (
      <div className="max-w-sm mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">You're subscribed!</h1>
        <p className="text-gray-600 mb-6">
          You'll receive the biweekly HIREX digest. Check your inbox for a welcome email.
        </p>
        <button
          onClick={() => navigate('/archive')}
          className="rounded bg-black px-6 py-2.5 text-white font-medium hover:bg-gray-800"
        >
          Browse Archive
        </button>
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
    <div className="max-w-sm mx-auto py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Subscribe to HIREX</h1>
      <p className="text-gray-600 mb-6">
        Receive the top 10 recently funded startups with hiring signals and contact info — biweekly, to your inbox.
      </p>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="rounded bg-black px-6 py-2.5 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Subscribing…' : 'Subscribe Free'}
      </button>
    </div>
  )
}
