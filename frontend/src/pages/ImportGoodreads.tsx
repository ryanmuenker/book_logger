import { useState, useRef } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'

type GoodreadsBook = {
  title: string
  author: string
  isbn: string
  isbn13: string
  rating: number
  date_read: string
  date_added: string
  shelves: string
  review: string
}

type ImportPreview = {
  books: GoodreadsBook[]
  duplicates: number
  new: number
}

export function ImportGoodreads() {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [editingIsbn, setEditingIsbn] = useState<number | null>(null)
  const [isbnInputs, setIsbnInputs] = useState<{[key: number]: string}>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  function parseGoodreadsCSV(csvText: string): GoodreadsBook[] {
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    
    // Find column indices
    const titleIndex = headers.findIndex(h => h.toLowerCase().includes('title'))
    const authorIndex = headers.findIndex(h => h.toLowerCase().includes('author'))
    const isbnIndex = headers.findIndex(h => h.toLowerCase().includes('isbn'))
    const ratingIndex = headers.findIndex(h => h.toLowerCase().includes('rating') && !h.toLowerCase().includes('average'))
    const dateReadIndex = headers.findIndex(h => h.toLowerCase().includes('date read'))
    const dateAddedIndex = headers.findIndex(h => h.toLowerCase().includes('date added'))
    const shelvesIndex = headers.findIndex(h => h.toLowerCase().includes('shelves'))
    const reviewIndex = headers.findIndex(h => h.toLowerCase().includes('review'))

    const books: GoodreadsBook[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Simple CSV parsing (handles quoted fields)
      const fields = parseCSVLine(line)
      
      if (fields.length < Math.max(titleIndex, authorIndex) + 1) continue
      
      const title = fields[titleIndex]?.replace(/"/g, '').trim()
      const author = fields[authorIndex]?.replace(/"/g, '').trim()
      
      if (!title || !author) continue
      
      books.push({
        title,
        author,
        isbn: fields[isbnIndex]?.replace(/"/g, '').trim() || '',
        isbn13: '', // Goodreads usually has ISBN13 in the same field
        rating: parseInt(fields[ratingIndex]?.replace(/"/g, '') || '0') || 0,
        date_read: fields[dateReadIndex]?.replace(/"/g, '').trim() || '',
        date_added: fields[dateAddedIndex]?.replace(/"/g, '').trim() || '',
        shelves: fields[shelvesIndex]?.replace(/"/g, '').trim() || '',
        review: fields[reviewIndex]?.replace(/"/g, '').trim() || '',
      })
    }
    
    return books
  }

  function parseCSVLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    fields.push(current)
    return fields
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    
    setError(null)
    
    try {
      const text = await file.text()
      const books = parseGoodreadsCSV(text)
      
      if (books.length === 0) {
        setError('No valid books found in the CSV file')
        return
      }
      
      // Preview the import
      const response = await fetch('/api/import/goodreads/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books })
      })
      
      if (!response.ok) {
        throw new Error('Failed to preview import')
      }
      
      const previewData = await response.json()
      setPreview(previewData)
      
    } catch (err) {
      setError('Failed to parse CSV file. Make sure it\'s a valid Goodreads export.')
    }
  }

  function updateBookIsbn(index: number, isbn: string) {
    if (!preview) return
    
    const updatedBooks = [...preview.books]
    updatedBooks[index].isbn = isbn
    setPreview({ ...preview, books: updatedBooks })
  }

  function saveIsbn(index: number) {
    const isbn = isbnInputs[index] || ''
    updateBookIsbn(index, isbn)
    setIsbnInputs(prev => ({ ...prev, [index]: '' }))
    setEditingIsbn(null)
  }

  async function confirmImport() {
    if (!preview) return
    
    setImporting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/import/goodreads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: preview.books })
      })
      
      if (!response.ok) {
        throw new Error('Failed to import books')
      }
      
      const result = await response.json()
      setImported(result.imported)
      setPreview(null)
      
    } catch (err) {
      setError('Failed to import books')
    } finally {
      setImporting(false)
    }
  }

  if (imported > 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4">🎉 Import Complete!</h2>
            <p className="text-gray-500 mb-6">
              Successfully imported {imported} books from your Goodreads library.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              View Your Library
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Import from Goodreads</h2>
        <p className="text-gray-500">
          Upload your Goodreads CSV export to import your books, ratings, and reading history.
        </p>
      </div>

      {!preview ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Step 1: Upload CSV File</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  To export your Goodreads data:
                </p>
                <ol className="text-sm text-gray-500 list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://www.goodreads.com/review/import" className="underline">Goodreads Import/Export</a></li>
                  <li>Click "Export Library"</li>
                  <li>Wait for the email with your CSV file</li>
                  <li>Download and upload the CSV file below</li>
                </ol>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose CSV File
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  or drag and drop your CSV file here
                </p>
              </div>
              
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Step 2: Review Import</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold">{preview.books.length}</div>
                  <div className="text-sm text-gray-500">Total Books</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-600">{preview.new}</div>
                  <div className="text-sm text-gray-500">New Books</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-yellow-600">{preview.duplicates}</div>
                  <div className="text-sm text-gray-500">Already in Library</div>
                </div>
              </div>
              
              <div className="mb-3 p-3 bg-blue-50 rounded text-sm">
                <strong>💡 Tip:</strong> Adding ISBNs will automatically show book covers in your library. 
                You can add or edit ISBNs for any book below before importing.
              </div>
              
              <div className="max-h-96 overflow-y-auto border rounded p-4">
                <h4 className="font-medium mb-3">Books to Import (showing first 10):</h4>
                {preview.books.slice(0, 10).map((book, i) => (
                  <div key={i} className="text-sm py-3 border-b last:border-b-0 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{book.title}</span>
                        {book.rating > 0 && <span className="text-yellow-600">★ {book.rating}</span>}
                      </div>
                      <div className="text-gray-500">by {book.author}</div>
                      {book.isbn && (
                        <div className="text-xs text-green-600 mt-1">ISBN: {book.isbn}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingIsbn === i ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="ISBN"
                            value={isbnInputs[i] || ''}
                            onChange={(e) => setIsbnInputs(prev => ({ ...prev, [i]: e.target.value }))}
                            className="w-24 px-2 py-1 text-xs border rounded"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveIsbn(i)
                              if (e.key === 'Escape') setEditingIsbn(null)
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveIsbn(i)}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingIsbn(null)}
                            className="text-xs px-2 py-1 bg-gray-600 text-white rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingIsbn(i)}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          {book.isbn ? 'Edit ISBN' : 'Add ISBN'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {preview.books.length > 10 && (
                  <div className="text-sm text-gray-500 mt-2">
                    ... and {preview.books.length - 10} more books
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button onClick={confirmImport} disabled={importing}>
                  {importing ? 'Importing...' : `Import ${preview.new} Books`}
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
