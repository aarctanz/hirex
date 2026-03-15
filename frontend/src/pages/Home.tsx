import { Link } from 'react-router-dom'
import { Zap, Users, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const { authenticated } = useAuth()

  return (
    <div className="mx-auto max-w-2xl py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Funding &rarr; Opportunity
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        HIREX tracks recently funded startups, enriches them with hiring signals and
        outreach contacts, and delivers a weekly digest to your inbox.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        {!authenticated ? (
          <>
            <Button size="lg" asChild>
              <Link to="/subscribe">Subscribe Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Login</Link>
            </Button>
          </>
        ) : (
          <Button size="lg" asChild>
            <Link to="/archive">View Archive</Link>
          </Button>
        )}
      </div>
      <div className="mt-16 grid grid-cols-3 gap-6 text-left">
        <Card>
          <CardContent className="pt-6">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">Fresh funding signals</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We track TechCrunch, Hacker News, and top VC blogs daily.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">Hiring intelligence</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each startup is enriched with careers pages, job links, and key contacts.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">Weekly digest</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Top 10 opportunities delivered to your inbox every week.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
