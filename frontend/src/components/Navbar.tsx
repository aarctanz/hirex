import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const { authenticated, subscribed, email, refresh } = useAuth()

  const handleLogout = async () => {
    await logout()
    refresh()
  }

  return (
    <nav className="border-b">
      <div className="mx-auto flex h-14 max-w-225 items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold tracking-tight">
          HIREX
        </Link>
        <div className="flex items-center gap-3">
          {authenticated && subscribed && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/archive">Archive</Link>
            </Button>
          )}
          {!authenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/subscribe">Subscribe</Link>
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">{email}</span>
              {!subscribed && (
                <Button size="sm" asChild>
                  <Link to="/subscribe">Subscribe</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
