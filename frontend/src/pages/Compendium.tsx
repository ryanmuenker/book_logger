import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { getFirstDefinition } from '../services/dictionary'

export function Compendium() {
  const { id } = useParams()
  const [data, setData] = useState<any | null>(null)
  const [word, setWord] = useState('')
  const [definition, setDefinition] = useState('')
  const [quote, setQuote] = useState('')
  const [loadingDefinition, setLoadingDefinition] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        } else {
          // Show user-friendly message when API fails
          setDefinition('')
        }
      } catch (error) {
        console.error('Failed to fetch definition:', error)
        setDefinition('')
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

  async function remove(entryId: number) {
    try {
      await axios.delete(`/vocab/api/${entryId}`)
      load()
    } catch (error) {
      setError('Failed to delete entry')
    }
  }

  if (error) return <div className="text-red-600 bg-white p-4 rounded">{error}</div>
  if (!data) return <div className="text-gray-900 bg-white p-4 rounded">Loading…</div>

  const book = data.book
  const entries = data.entries ?? []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-0 text-gray-900">Compendium: {book.title}</h2>
          <div className="text-gray-500">{book.author}</div>
        </div>
        <Link to={`/books/${book.id}`}>
          <Button variant="outline">Back to book</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-900">Add Vocabulary</h3>
          <form className="space-y-3" onSubmit={add}>
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

        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-900">Vocabulary ({entries.length})</h3>
          <div className="space-y-3">
            {entries.map((e: any) => (
              <Card key={e.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">{e.word}</div>
                      <div className="text-sm text-gray-500 mt-1">{e.definition || 'No definition'}</div>
                      {e.quote && (
                        <blockquote className="text-sm italic border-l-2 border-gray-200 pl-3 mt-2">
                          "{e.quote}"
                        </blockquote>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => remove(e.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!entries.length && (
              <div className="text-center text-gray-500 py-8">
                No vocabulary entries yet. Add some words to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
