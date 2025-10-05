import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Loading } from '../components/ui/loading'
import { Error } from '../components/ui/error'
import { Link } from 'react-router-dom'

type VocabEntry = {
  id: number
  word: string
  definition: string
  quote: string
  srs_box: number
  book_id: number
  book_title: string
  book_author: string
}

type Book = {
  id: number
  title: string
  author: string
}

export function Review() {
  const [entries, setEntries] = useState<VocabEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [availableBooks, setAvailableBooks] = useState<Book[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'flashcard'>('list')
  const [allEntries, setAllEntries] = useState<VocabEntry[]>([])

  useEffect(() => {
    loadBooks()
    loadQueue()
  }, [])

  useEffect(() => {
    loadQueue()
  }, [selectedBookId])

  async function loadBooks() {
    try {
      const response = await axios.get('/vocab/review/books')
      setAvailableBooks(response.data.books || [])
    } catch (err) {
      console.error('Failed to load books:', err)
    }
  }

  async function loadQueue() {
    setLoading(true)
    try {
      // Always load all entries first
      const allResponse = await axios.get('/vocab/review/queue?format=json')
      if (allResponse.data && allResponse.data.entries) {
        setAllEntries(allResponse.data.entries)
        
        // If no book filter, show all entries
        if (!selectedBookId) {
          setEntries(allResponse.data.entries)
        } else {
          // Filter by selected book
          const filteredEntries = allResponse.data.entries.filter(
            (entry: VocabEntry) => entry.book_id === selectedBookId
          )
          setEntries(filteredEntries)
        }
      } else {
        setAllEntries([])
        setEntries([])
      }
    } catch (err) {
      setError('Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer(difficulty: 'easy' | 'medium' | 'hard') {
    if (currentIndex >= entries.length) return
    
    const entry = entries[currentIndex]
    if (!entry) return
    const result = difficulty === 'easy' ? 'correct' : difficulty === 'hard' ? 'wrong' : 'correct'
    
    try {
      await axios.post(`/vocab/review/${entry.id}/answer`, new URLSearchParams({ result }))
      
      if (currentIndex + 1 >= entries.length) {
        setCompleted(true)
      } else {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      }
    } catch (err) {
      setError('Failed to submit answer')
    }
  }

  function reset() {
    setCurrentIndex(0)
    setShowAnswer(false)
    setCompleted(false)
    loadQueue()
  }

  function changeBookFilter(bookId: number | null) {
    setSelectedBookId(bookId)
    setCurrentIndex(0)
    setShowAnswer(false)
    setCompleted(false)
  }

  if (loading) return <Loading text="Loading review queue..." />
  if (error) return <Error error={error} onRetry={() => { setError(null); loadQueue() }} />
  if (completed) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">🎉 Review Complete!</h2>
        <p className="text-gray-500 mb-6">Great job! You've finished all cards in your review queue.</p>
        <div className="space-x-4">
          <Button onClick={reset}>Review Again</Button>
          <Link to="/"><Button variant="outline">Back to Library</Button></Link>
        </div>
      </div>
    )
  }
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-4">📚 No vocabulary yet!</h2>
        <p className="text-gray-500 mb-6">Add some vocabulary to your books to get started with flashcard review.</p>
        <Link to="/"><Button>Back to Library</Button></Link>
      </div>
    )
  }

  const currentEntry = entries[currentIndex]
  if (!currentEntry) return <Loading text="Loading..." />
  
  const progress = `${currentIndex + 1} of ${entries.length}`

  // List View Component
  if (viewMode === 'list') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Vocabulary List</h2>
          <Button onClick={() => setViewMode('flashcard')}>
            Start Flashcard Review
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold">{entries.length}</div>
            <div className="text-sm text-gray-500">{selectedBookId ? 'Filtered Cards' : 'Total Cards'}</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold">{entries.filter(e => e.srs_box === 1).length}</div>
            <div className="text-sm text-gray-500">New Cards</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-semibold">{availableBooks.length}</div>
            <div className="text-sm text-gray-500">Books</div>
          </Card>
        </div>

        {/* Book Filter */}
        {availableBooks.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Filter by book:</label>
            <Select
              value={selectedBookId?.toString() || 'all'}
              onValueChange={(value) => changeBookFilter(value === 'all' ? null : parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder={`All books (${allEntries.length} cards)`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All books ({allEntries.length} cards)</SelectItem>
                {availableBooks.map(book => (
                  <SelectItem key={book.id} value={book.id.toString()}>
                    {book.title} by {book.author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Vocabulary List */}
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{entry.word}</h3>
                    <Badge 
                      variant={
                        entry.srs_box === 1 ? 'new' :
                        entry.srs_box === 2 ? 'learning' :
                        entry.srs_box === 3 ? 'review' :
                        entry.srs_box === 4 ? 'mastered' :
                        'advanced'
                      }
                    >
                      {entry.srs_box === 1 ? 'New' :
                       entry.srs_box === 2 ? 'Learning' :
                       entry.srs_box === 3 ? 'Review' :
                       entry.srs_box === 4 ? 'Mastered' :
                       `Box ${entry.srs_box}`}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    From: <strong>{entry.book_title}</strong>
                    {entry.book_author && ` by ${entry.book_author}`}
                  </div>
                  {entry.definition && (
                    <p className="text-sm text-gray-700 mb-2">{entry.definition}</p>
                  )}
                  {entry.quote && (
                    <blockquote className="text-xs italic text-gray-600 border-l-2 border-gray-200 pl-3">
                      "{entry.quote}"
                    </blockquote>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {entries.length === 0 && (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No vocabulary found</h3>
            <p className="text-gray-500 mb-4">
              {selectedBookId ? 'No vocabulary entries for this book.' : 'Add some vocabulary to get started.'}
            </p>
            <Link to="/">
              <Button>Back to Library</Button>
            </Link>
          </Card>
        )}
      </div>
    )
  }

  // Flashcard View Component
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setViewMode('list')}>
            ← Back to List
          </Button>
          <h2 className="text-2xl font-semibold">Vocabulary Flashcards</h2>
        </div>
        <div className="text-sm text-gray-500">{progress}</div>
      </div>

      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / entries.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-gray-500">
                From: <strong>{currentEntry.book_title}</strong>
                {currentEntry.book_author && ` by ${currentEntry.book_author}`}
              </div>
              {currentEntry.quote && (
                <blockquote className="text-sm italic border-l-2 border-gray-200 pl-4 mt-2">
                  "{currentEntry.quote}"
                </blockquote>
              )}
            </div>
            <Badge 
              variant={
                currentEntry.srs_box === 1 ? 'new' :
                currentEntry.srs_box === 2 ? 'learning' :
                currentEntry.srs_box === 3 ? 'review' :
                currentEntry.srs_box === 4 ? 'mastered' :
                'advanced'
              }
              className="text-xs"
            >
              {currentEntry.srs_box === 1 ? 'New' :
               currentEntry.srs_box === 2 ? 'Learning' :
               currentEntry.srs_box === 3 ? 'Review' :
               currentEntry.srs_box === 4 ? 'Mastered' :
               `Box ${currentEntry.srs_box}`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-6">{currentEntry.word}</h3>
            
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)} size="lg">
                Show Answer
              </Button>
            ) : (
              <div className="space-y-6">
                <div className="text-lg text-gray-500">
                  {currentEntry.definition || 'No definition available'}
                </div>
                
                <div className="flex justify-center gap-3">
                  <Button 
                    variant="destructive" 
                    onClick={() => submitAnswer('hard')}
                  >
                    Again
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => submitAnswer('medium')}
                  >
                    Good
                  </Button>
                  <Button 
                    onClick={() => submitAnswer('easy')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Easy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skip Button */}
      <div className="text-center">
        <Button variant="ghost" onClick={() => submitAnswer('medium')}>
          Skip this card
        </Button>
      </div>
    </div>
  )
}
