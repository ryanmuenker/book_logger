import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Loading } from '../components/ui/loading'

export function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function runSearch() {
    setLoading(true)
    setMsg(null)
    try {
      const r = await axios.get('/api/search', { params: { q } })
      setResults(r.data.results || [])
    } finally {
      setLoading(false)
    }
  }

  async function addToLibrary(item: any) {
    const resp = await fetch('/api/add_to_library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isbn: item.isbn,
        title: item.title,
        author: item.author,
        cover_id: item.cover_id
      })
    })
    if (resp.ok) setMsg('Added to library.')
    else setMsg('Failed to add.')
  }

  useEffect(() => { if (!q) setResults([]) }, [q])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title or author…" className="flex-1" />
        <Button onClick={runSearch}>Search</Button>
      </div>
      {msg && <div className="text-sm">{msg}</div>}
      {loading && <Loading text="Searching books..." />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {results.map(r => (
          <Card key={r.key}>
            <CardContent className="p-4">
              {(r.isbn || r.cover_id) && (
                <img
                  src={r.isbn
                    ? `https://covers.openlibrary.org/b/isbn/${r.isbn}-M.jpg`
                    : `https://covers.openlibrary.org/b/id/${r.cover_id}-M.jpg`}
                  alt="cover"
                  className="w-full h-48 object-cover mb-2 rounded"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-gray-500">{r.author}</div>
              <div className="text-xs">ISBN: {r.isbn || '-'}</div>
              <div className="mt-2">
                <Button size="sm" onClick={() => addToLibrary(r)}>Add to library</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


