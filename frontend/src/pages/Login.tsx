import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    setError(null)
    try {
      await axios.post('/auth/login', { email, password })
      navigate('/')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="max-w-sm">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form className="space-y-3" onSubmit={submit}>
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="border rounded px-3 py-2" type="submit">Login</button>
      </form>
      <div className="text-sm mt-2">No account? <Link className="underline" to="/register">Register</Link></div>
    </div>
  )
}


