import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export function App() {
  const [user, setUser] = useState<{id:number,email:string}|null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/auth/me').then(r => setUser(r.data.user)).catch(() => setUser(null))
  }, [])

  async function logout() {
    await axios.post('/auth/logout')
    setUser(null)
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
            <a href="/export.json" className="underline">Export JSON</a>
            <a href="/export.csv" className="underline">Export CSV</a>
            {user ? (
              <>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <button onClick={logout} className="border rounded px-2 py-1">Logout</button>
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


