import { Outlet, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'

export function App() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  async function logout() {
    await axios.post('/auth/logout')
    await refreshUser()
    navigate('/login')
  }
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">Book Logger</Link>
          <nav className="flex gap-4 text-sm items-center">
            <Link to="/search" className="underline">Search</Link>
            {user && <Link to="/my" className="underline">My Library</Link>}
            {user && <Link to="/review" className="underline">Review</Link>}
            {user && <Link to="/import/goodreads" className="underline">Import</Link>}
            <a href="/export.json" className="underline">Export JSON</a>
            <a href="/export.csv" className="underline">Export CSV</a>
            {user ? (
              <>
                <span className="text-xs text-gray-500">{user.email}</span>
                <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login" className="underline">Login</Link>
                <Link to="/register" className="underline">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}


