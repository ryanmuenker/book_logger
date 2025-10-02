import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export function BookDetail() {
  const { id } = useParams()
  const [data, setData] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    axios.get(`/vocab/book/${id}?format=json`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load'))
  }

  useEffect(() => { load() }, [id])

  async function add(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const form = ev.currentTarget
    const formData = new FormData(form)
    const payload = {
      book_id: Number(id),
      word: String(formData.get('word') || ''),
      definition: String(formData.get('definition') || ''),
      quote: String(formData.get('quote') || ''),
    }
    setSaving(true)
    try {
      await axios.post('/vocab/api', payload)
      form.reset()
      load()
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return <div>Loading…</div>

  // Handle unauthenticated redirect (HTML) or unexpected payloads gracefully
  if (!data.book) {
    return (
      <div className="space-y-2">
        <div className="text-red-600">Unable to load book details.</div>
        <div className="text-sm text-muted-foreground">If you are not logged in, please <a className="underline" href="/login">log in</a> and try again.</div>
      </div>
    )
  }

  const book = data.book
  const entries = data.entries ?? []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        {(book.isbn || book.cover_id) && (
          <img
            src={book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg` : `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`}
            alt="cover"
            className="w-full h-64 object-cover rounded mb-3"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <h2 className="text-xl font-semibold">{book.title}</h2>
        <div className="text-sm text-muted-foreground">{book.author}</div>
        <h3 className="mt-6 mb-2 font-medium">Compendium</h3>
        <div className="space-y-2">
          {entries.map((e: any) => (
            <Card key={e.id}><CardContent>
              <div className="font-medium">{e.word}</div>
              {e.definition && <div className="text-sm text-muted-foreground">{e.definition}</div>}
              {e.quote && <blockquote className="text-sm italic">{e.quote}</blockquote>}
            </CardContent></Card>
          ))}
          {!entries.length && <div className="text-muted-foreground">No entries yet.</div>}
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium">Add Vocabulary</h3>
        <form className="space-y-2" onSubmit={add}>
          <input name="word" placeholder="Word" required className="w-full border rounded px-3 py-2" />
          <textarea name="definition" placeholder="Definition" className="w-full border rounded px-3 py-2" />
          <textarea name="quote" placeholder="Quote (optional)" className="w-full border rounded px-3 py-2" />
          <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
        </form>
      </div>
    </div>
  )
}


