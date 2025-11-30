import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    setError(null)
    try {
      await axios.post('/auth/login', { email, password })
      await refreshUser()
      navigate('/')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button className="w-full" type="submit">Login</Button>
        </form>
        <div className="text-sm mt-4 text-center">No account? <Link className="underline" to="/register">Register</Link></div>
      </CardContent>
    </Card>
  )
}


