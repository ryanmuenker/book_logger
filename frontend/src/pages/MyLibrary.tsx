import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent } from '../components/ui/card'
import { Link } from 'react-router-dom'

export function MyLibrary() {
  const [items, setItems] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    axios.get('/api/my.json')
      .then(r => { if (mounted) setItems(r.data) })
      .catch(() => { if (mounted) setError('Failed to load') })
    return () => { mounted = false }
  }, [])

  if (error) return <div className="text-red-600">{error}</div>
  if (!items) return <div>Loading…</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((it, idx) => (
        <Card key={idx}>
          <CardContent>
            {(it.book.isbn || it.book.cover_id) && (
              <img
                src={it.book.isbn ? `https://covers.openlibrary.org/b/isbn/${it.book.isbn}-M.jpg` : `https://covers.openlibrary.org/b/id/${it.book.cover_id}-M.jpg`}
                alt="cover"
                className="w-full h-48 object-cover rounded mb-2"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="font-medium"><Link to={`/books/${it.book.id}`}>{it.book.title}</Link></div>
            <div className="text-sm text-muted-foreground">{it.book.author}</div>
            <div className="text-xs mt-1">Status: {it.status || '-'}</div>
            <div className="text-xs">Rating: {it.rating ?? '-'}</div>
          </CardContent>
        </Card>
      ))}
      {!items.length && <div className="text-muted-foreground">No books yet.</div>}
    </div>
  )
}


