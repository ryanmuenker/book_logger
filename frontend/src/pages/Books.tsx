import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'

export function Books() {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    axios.get('/export.json')
      .then(r => { if (mounted) setBooks(r.data || []) })
      .catch(() => { if (mounted) setError('Failed to load') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')

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
      const okTag = !wantTag || tags.split(',').map(s => s.trim()).includes(wantTag)
      return okQ && okTag
    })
  }, [books, q, tag])

  async function remove(id: number) {
    await fetch(`/books/${id}/delete`, { method: 'POST' })
    // reload list
    const r = await axios.get('/export.json')
    setBooks(r.data)
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}
      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search title or author…"
          className="flex-1"
        />
        <Select value={tag} onChange={e => setTag(e.target.value)}>
          <option value="">All tags</option>
          {allTags.map(t => (
            <option key={t} value={t.toLowerCase()}>{t}</option>
          ))}
        </Select>
        <Link to="/books/new" className="border rounded px-3 py-2">Add Book</Link>
        <Link to="/search" className="border rounded px-3 py-2">Search</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading && <div>Loading…</div>}
        {!loading && filtered.map(b => (
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
              <div className="font-medium"><Link to={`/books/${b.id}`}>{b.title}</Link></div>
              <div className="text-sm text-muted-foreground">{b.author}</div>
              <div className="text-xs mt-1">Rating: {b.rating ?? '-'}</div>
              <div className="mt-2 space-x-1">
                {(b.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
                  <span key={t} className="inline-block text-xs bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-0.5">{t}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Link className="border rounded px-2 py-1 text-sm" to={`/books/${b.id}/edit`}>Edit</Link>
                <button className="border rounded px-2 py-1 text-sm" onClick={() => remove(b.id)}>Delete</button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && !filtered.length && <div className="text-muted-foreground">No books match.</div>}
      </div>
    </div>
  )
}


