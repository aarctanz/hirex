import { useState, useEffect } from 'react'
import { getSession } from '../lib/api'

export interface AuthState {
  loading: boolean
  authenticated: boolean
  subscribed: boolean
  email: string | null
  refresh: () => void
}

export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    getSession()
      .then((data) => {
        setAuthenticated(data.authenticated)
        setSubscribed(data.subscribed)
        setEmail(data.email)
      })
      .catch(() => {
        setAuthenticated(false)
        setSubscribed(false)
        setEmail(null)
      })
      .finally(() => setLoading(false))
  }, [tick])

  return {
    loading,
    authenticated,
    subscribed,
    email,
    refresh: () => setTick((t) => t + 1),
  }
}
