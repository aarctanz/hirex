import { Link } from 'react-router-dom'
import { Zap, Users, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const EXAMPLE_STARTUPS = [
  {
    name: 'Astra Robotics',
    category: 'AI / Robotics',
    round: 'Series A',
    amount: '$18M',
    summary: 'Building autonomous warehouse robots with computer vision.',
    hiringSignal: 0.9,
  },
  {
    name: 'Pylon Health',
    category: 'Health Tech',
    round: 'Seed',
    amount: '$6.5M',
    summary: 'AI-powered diagnostic platform for rural clinics.',
    hiringSignal: 0.7,
  },
  {
    name: 'Noctis Security',
    category: 'Cybersecurity',
    round: 'Series B',
    amount: '$42M',
    summary: 'Zero-trust endpoint protection for distributed teams.',
    hiringSignal: 0.8,
  },
  {
    name: 'Verdant Energy',
    category: 'Climate Tech',
    round: 'Series A',
    amount: '$25M',
    summary: 'Next-gen solid-state batteries for grid storage.',
    hiringSignal: 0.6,
  },
  {
    name: 'Loom Finance',
    category: 'Fintech',
    round: 'Seed',
    amount: '$9M',
    summary: 'Embedded payroll and benefits API for SMBs.',
    hiringSignal: 0.85,
  },
]

const SOURCES = [
  { name: 'TechCrunch', icon: '📰' },
  { name: 'Hacker News', icon: '🟧' },
  { name: 'YC Blog', icon: '🚀' },
  { name: 'Crunchbase', icon: '📊' },
  { name: 'PitchBook', icon: '📈' },
  { name: 'AngelList', icon: '👼' },
  { name: 'VentureBeat', icon: '⚡' },
  { name: 'The Information', icon: '🔍' },
]

export default function Home() {
  const { authenticated } = useAuth()

  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Funding &rarr; Opportunity
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
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
      </section>

      {/* Animated Sources Ticker */}
      <section className="overflow-hidden border-y py-6">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Sources we monitor
        </p>
        <div className="relative">
          <div className="flex w-max animate-scroll gap-12">
            {[...SOURCES, ...SOURCES].map((source, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <span className="text-2xl">{source.icon}</span>
                <span className="whitespace-nowrap text-sm font-medium">{source.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="grid gap-6 sm:grid-cols-3">
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
      </section>

      {/* Example Digest */}
      <section className="pb-20">
        <h2 className="text-2xl font-bold">Example Digest</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what a typical weekly digest looks like.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {EXAMPLE_STARTUPS.map((startup, i) => (
            <Card key={startup.name}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                    <span className="font-semibold">{startup.name}</span>
                    <Badge variant="secondary">{startup.category}</Badge>
                  </div>
                  <Badge variant={startup.hiringSignal > 0.7 ? 'default' : 'secondary'}>
                    {startup.hiringSignal.toFixed(1)} hiring
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{startup.round}</span>
                  <span> &middot; {startup.amount}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{startup.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
