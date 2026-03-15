import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Subscribe from '@/pages/Subscribe'
import Archive from '@/pages/Archive'
import ArchiveDetail from '@/pages/ArchiveDetail'
import StartupDetail from '@/pages/StartupDetail'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-225 px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route
            path="/archive"
            element={<ProtectedRoute><Archive /></ProtectedRoute>}
          />
          <Route
            path="/archive/:digestId"
            element={<ProtectedRoute><ArchiveDetail /></ProtectedRoute>}
          />
          <Route
            path="/startup/:startupId"
            element={<ProtectedRoute><StartupDetail /></ProtectedRoute>}
          />
        </Routes>
      </main>
    </>
  )
}
