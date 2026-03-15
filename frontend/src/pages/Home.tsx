import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { authenticated } = useAuth()

  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Funding → Opportunity
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        HIREX tracks recently funded startups, enriches them with hiring signals and
        outreach contacts, and delivers a biweekly digest to your inbox.
      </p>
      <div className="flex gap-4 justify-center">
        {!authenticated ? (
          <>
            <Link
              to="/subscribe"
              className="rounded bg-black px-6 py-2.5 text-white font-medium hover:bg-gray-800"
            >
              Subscribe Free
            </Link>
            <Link
              to="/login"
              className="rounded border px-6 py-2.5 font-medium hover:bg-gray-50"
            >
              Login
            </Link>
          </>
        ) : (
          <Link
            to="/archive"
            className="rounded bg-black px-6 py-2.5 text-white font-medium hover:bg-gray-800"
          >
            View Archive
          </Link>
        )}
      </div>
      <div className="mt-16 grid grid-cols-3 gap-8 text-left">
        <div>
          <h3 className="font-semibold mb-1">Fresh funding signals</h3>
          <p className="text-sm text-gray-500">
            We track TechCrunch, Hacker News, and top VC blogs daily.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Hiring intelligence</h3>
          <p className="text-sm text-gray-500">
            Each startup is enriched with careers pages, job links, and key contacts.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Biweekly digest</h3>
          <p className="text-sm text-gray-500">
            Top 10 opportunities delivered to your inbox every two weeks.
          </p>
        </div>
      </div>
    </div>
  )
}
