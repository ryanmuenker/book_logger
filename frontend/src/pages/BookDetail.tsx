import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { getFirstDefinition } from '../services/dictionary'

export function BookDetail() {
  const { id } = useParams()
  const [data, setData] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [word, setWord] = useState('')
  const [definition, setDefinition] = useState('')
  const [quote, setQuote] = useState('')
  const [loadingDefinition, setLoadingDefinition] = useState(false)

  function load() {
    setError(null)
    axios.get(`/vocab/book/${id}?format=json`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load'))
  }

  useEffect(() => { load() }, [id])

  // Auto-fetch definition when word changes
  useEffect(() => {
    if (!word.trim()) {
      setDefinition('')
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoadingDefinition(true)
      try {
        const def = await getFirstDefinition(word)
        if (def) {
          setDefinition(def)
        }
      } catch (error) {
        console.error('Failed to fetch definition:', error)
      } finally {
        setLoadingDefinition(false)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [word])

  async function add(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const payload = {
      book_id: Number(id),
      word: word.trim(),
      definition: definition.trim(),
      quote: quote.trim(),
    }
    setSaving(true)
    try {
      await axios.post('/vocab/api', payload)
      setWord('')
      setDefinition('')
      setQuote('')
      load()
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className="text-red-600 bg-white p-4 rounded">{error}</div>
  if (!data) return <div className="text-gray-900 bg-white p-4 rounded">Loading…</div>

  // Handle unauthenticated redirect (HTML) or unexpected payloads gracefully
  if (!data.book) {
    return (
      <div className="space-y-2">
        <div className="text-red-600">Unable to load book details.</div>
        <div className="text-sm text-gray-500">If you are not logged in, please <a className="underline" href="/login">log in</a> and try again.</div>
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
        <div className="text-sm text-gray-500">{book.author}</div>
        <h3 className="mt-6 mb-2 font-medium">Compendium</h3>
        <div className="space-y-2">
          {entries.slice(0, 3).map((e: any) => (
            <Card key={e.id}><CardContent>
              <div className="font-medium">{e.word}</div>
              {e.definition && <div className="text-sm text-gray-500">{e.definition}</div>}
              {e.quote && <blockquote className="text-sm italic">{e.quote}</blockquote>}
            </CardContent></Card>
          ))}
          {entries.length > 3 && (
            <div className="text-sm text-gray-500">... and {entries.length - 3} more</div>
          )}
          {!entries.length && <div className="text-gray-500">No entries yet.</div>}
          {entries.length > 0 && (
            <div className="mt-2">
              <Link to={`/vocab/book/${book.id}`}>
                <Button variant="outline" size="sm">View full compendium</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900">Add Vocabulary</h3>
        <form className="space-y-2" onSubmit={add}>
          <div>
            <Input 
              value={word}
              onChange={e => setWord(e.target.value)}
              placeholder="Word" 
              required 
            />
            {loadingDefinition && (
              <div className="text-xs text-gray-500 mt-1">Fetching definition...</div>
            )}
          </div>
          <textarea 
            value={definition}
            onChange={e => setDefinition(e.target.value)}
            placeholder="Definition (auto-filled from dictionary)" 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
            rows={3}
          />
          <textarea 
            value={quote}
            onChange={e => setQuote(e.target.value)}
            placeholder="Quote (optional)" 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50" 
            rows={2}
          />
          <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
        </form>
      </div>
    </div>
  )
}


