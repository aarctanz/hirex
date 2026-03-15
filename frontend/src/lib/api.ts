import type {
  SessionResponse,
  SubscriptionStatusResponse,
  ArchiveListResponse,
  ArchiveDetailResponse,
  StartupDetailResponse,
} from '../../../src/types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// Auth
export const requestOtp = (email: string) =>
  apiFetch<{ ok: boolean }>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const verifyOtp = (email: string, otp: string) =>
  apiFetch<{ ok: boolean }>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })

export const logout = () =>
  apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })

export const getSession = () =>
  apiFetch<SessionResponse>('/api/auth/session')

// Subscription
export const subscribe = () =>
  apiFetch<{ ok: boolean }>('/api/subscribe', { method: 'POST' })

export const unsubscribe = () =>
  apiFetch<{ ok: boolean }>('/api/unsubscribe', { method: 'POST' })

export const getSubscriptionStatus = () =>
  apiFetch<SubscriptionStatusResponse>('/api/subscription/status')

// Archive
export const getArchive = () =>
  apiFetch<ArchiveListResponse>('/api/archive')

export const getArchiveDetail = (digestId: number) =>
  apiFetch<ArchiveDetailResponse>(`/api/archive/${digestId}`)

export const getStartup = (startupId: number) =>
  apiFetch<StartupDetailResponse>(`/api/startups/${startupId}`)
