import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../lib/api'

export default function Navbar() {
  const { authenticated, subscribed, email, refresh } = useAuth()

  const handleLogout = async () => {
    await logout()
    refresh()
  }

  return (
    <nav className="border-b px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          HIREX
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {authenticated && subscribed && (
            <Link to="/archive" className="hover:underline">
              Archive
            </Link>
          )}
          {!authenticated ? (
            <>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link
                to="/subscribe"
                className="rounded bg-black px-3 py-1 text-white hover:bg-gray-800"
              >
                Subscribe
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-gray-500">{email}</span>
              {!subscribed && (
                <Link
                  to="/subscribe"
                  className="rounded bg-black px-3 py-1 text-white hover:bg-gray-800"
                >
                  Subscribe
                </Link>
              )}
              <button onClick={handleLogout} className="hover:underline">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
