import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestOtp, verifyOtp } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestOtp(email)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyOtp(email, otp)
      navigate('/archive')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto py-20">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      {step === 'email' ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <label className="text-sm font-medium">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>
          <label className="text-sm font-medium">
            One-time code
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="mt-1 w-full rounded border px-3 py-2 text-sm tracking-widest"
              placeholder="123456"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={() => { setStep('email'); setOtp(''); setError(null) }}
            className="text-sm text-gray-500 hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  )
}
