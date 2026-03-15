import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { loading, authenticated, subscribed } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
  }

  if (!authenticated || !subscribed) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
