import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Input } from '../components/ui/input'
import { DateInput } from '../components/ui/date-input'
import { Autocomplete } from '../components/ui/autocomplete'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'

type Book = {
  id?: number
  title: string
  author: string
  start_date?: string | null
  finish_date?: string | null
  rating?: number | null
  tags?: string
  notes?: string
}

export function BookForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [book, setBook] = useState<Book>({ title: '', author: '', start_date: '', finish_date: '', rating: null, tags: '', notes: '' })
  const [loading, setLoading] = useState<boolean>(!!id)
  const [error, setError] = useState<string | null>(null)
  const [authors, setAuthors] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    // Use export.json list to find the book quickly
    axios.get('/export.json')
      .then(r => {
        if (!mounted) return
        const found = (r.data || []).find((b: any) => String(b.id) === String(id))
        if (found) setBook(found)
        else setError('Book not found')
      })
      .catch(() => { if (mounted) setError('Failed to load') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  // Load suggestions for autocomplete
  useEffect(() => {
    axios.get('/export.json')
      .then(r => {
        const books = r.data || []
        
        // Extract unique authors
        const authorSet = new Set<string>()
        books.forEach((b: any) => {
          if (b.author) authorSet.add(b.author)
        })
        setAuthors(Array.from(authorSet).sort())
        
        // Extract unique tags
        const tagSet = new Set<string>()
        books.forEach((b: any) => {
          if (b.tags) {
            b.tags.split(',').forEach((tag: string) => {
              const trimmed = tag.trim()
              if (trimmed) tagSet.add(trimmed)
            })
          }
        })
        setTags(Array.from(tagSet).sort())
      })
      .catch(() => {
        // Silently fail - suggestions are nice to have, not essential
      })
  }, [])

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const form = ev.currentTarget
    const formData = new FormData(form)
    const payload = {
      title: String(formData.get('title') || ''),
      author: String(formData.get('author') || ''),
      start_date: String(formData.get('start_date') || ''),
      finish_date: String(formData.get('finish_date') || ''),
      rating: formData.get('rating') ? Number(formData.get('rating')) : '',
      tags: String(formData.get('tags') || ''),
      notes: String(formData.get('notes') || ''),
    }
    if (!payload.title || !payload.author) {
      setError('Title and Author are required')
      return
    }

    if (isEdit) {
      const resp = await fetch(`/books/${id}/edit`, { method: 'POST', body: new URLSearchParams(payload as any) })
      if (!resp.ok) { setError('Failed to update'); return }
    } else {
      const resp = await fetch('/books/new', { method: 'POST', body: new URLSearchParams(payload as any) })
      if (!resp.ok) { setError('Failed to create'); return }
    }
    navigate('/')
  }

  if (loading) return <div>Loading…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">{isEdit ? 'Edit Book' : 'Add Book'}</h2>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>}
          
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input 
                name="title" 
                placeholder="Enter book title" 
                defaultValue={book.title} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Author *</label>
              <Autocomplete
                name="author"
                placeholder="Enter author name"
                defaultValue={book.author}
                suggestions={authors}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <DateInput 
                  name="start_date" 
                  placeholder="YYYY-MM-DD"
                  defaultValue={book.start_date || ''} 
                />
                <p className="text-xs text-gray-500 mt-1">When you started reading</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Finish Date</label>
                <DateInput 
                  name="finish_date" 
                  placeholder="YYYY-MM-DD"
                  defaultValue={book.finish_date || ''} 
                />
                <p className="text-xs text-gray-500 mt-1">When you finished reading</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <Input 
                name="rating" 
                type="number" 
                min="1" 
                max="5" 
                placeholder="1-5 stars" 
                defaultValue={book.rating ?? ''} 
              />
              <p className="text-xs text-gray-500 mt-1">Rate from 1 to 5 stars</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <Autocomplete
                name="tags"
                placeholder="Enter tags (comma separated)"
                defaultValue={book.tags || ''}
                suggestions={tags}
              />
              <p className="text-xs text-gray-500 mt-1">e.g., fiction, mystery, non-fiction</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea 
                name="notes" 
                placeholder="Your thoughts, quotes, or notes about this book..." 
                defaultValue={book.notes || ''} 
                className="w-full min-h-24 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
                rows={4}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {isEdit ? 'Save Changes' : 'Add Book'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


