import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Loading } from '../components/ui/loading'
import { Error } from '../components/ui/error'

export function Books() {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [tag, setTag] = useState('all')

  function loadBooks() {
    setLoading(true)
    setError(null)
    axios.get('/export.json')
      .then(r => setBooks(r.data || []))
      .catch(() => setError('Failed to load books'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBooks()
  }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const b of books) {
      const raw = (b.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean)
      raw.forEach((t: string) => set.add(t))
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [books])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const wantTag = tag.trim().toLowerCase()
    return books.filter(b => {
      const title = String(b.title || '').toLowerCase()
      const author = String(b.author || '').toLowerCase()
      const tags = String(b.tags || '').toLowerCase()
      const okQ = !query || title.includes(query) || author.includes(query)
      const okTag = !wantTag || wantTag === 'all' || tags.split(',').map(s => s.trim()).includes(wantTag)
      return okQ && okTag
    })
  }, [books, q, tag])

  async function remove(id: number) {
    await fetch(`/books/${id}/delete`, { method: 'POST' })
    loadBooks()
  }

  if (loading) return <Loading text="Loading books..." />
  if (error) return <Error error={error} onRetry={loadBooks} />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search title or author…"
          className="flex-1"
        />
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {allTags.map(t => (
              <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link to="/books/new">Add Book</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/search">Search</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(b => (
          <Card key={b.id}>
            <CardContent>
              {(b.isbn || b.cover_id) && (
                <img
                  src={b.isbn ? `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg` : `https://covers.openlibrary.org/b/id/${b.cover_id}-M.jpg`}
                  alt="cover"
                  className="w-full h-48 object-cover rounded mb-2"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="font-medium text-gray-900"><Link to={`/books/${b.id}`} className="text-gray-900 hover:text-blue-600">{b.title}</Link></div>
              <div className="text-sm text-gray-500">{b.author}</div>
              <div className="text-xs mt-1 text-gray-700">Rating: {b.rating ?? '-'}</div>
              <div className="mt-2 space-x-1">
                {(b.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
                  <span key={t} className="inline-block text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">{t}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/books/${b.id}/edit`}>Edit</Link>
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtered.length && <div className="text-gray-500">No books match.</div>}
      </div>
    </div>
  )
}


