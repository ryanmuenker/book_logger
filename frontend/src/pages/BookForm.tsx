import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

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
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold mb-4">{isEdit ? 'Edit Book' : 'Add Book'}</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form className="space-y-3" onSubmit={submit}>
        <input name="title" placeholder="Title" defaultValue={book.title} className="w-full border rounded px-3 py-2" required />
        <input name="author" placeholder="Author" defaultValue={book.author} className="w-full border rounded px-3 py-2" required />
        <div className="grid grid-cols-2 gap-2">
          <input name="start_date" placeholder="Start date" defaultValue={book.start_date || ''} className="border rounded px-3 py-2" />
          <input name="finish_date" placeholder="Finish date" defaultValue={book.finish_date || ''} className="border rounded px-3 py-2" />
        </div>
        <input name="rating" type="number" min="1" max="5" placeholder="Rating (1-5)" defaultValue={book.rating ?? ''} className="w-full border rounded px-3 py-2" />
        <input name="tags" placeholder="Tags (comma separated)" defaultValue={book.tags || ''} className="w-full border rounded px-3 py-2" />
        <textarea name="notes" placeholder="Notes" defaultValue={book.notes || ''} className="w-full border rounded px-3 py-2" />
        <button className="border rounded px-3 py-2" type="submit">{isEdit ? 'Save' : 'Create'}</button>
      </form>
    </div>
  )
}


