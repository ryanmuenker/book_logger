import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AutocompleteProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onSelect'> {
  suggestions: string[]
  onSelect?: (value: string) => void
}

export const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ className, suggestions, onSelect, ...props }, ref) => {
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLUListElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (props.onChange) props.onChange(e)

      if (value.trim()) {
        const filtered = suggestions.filter(s => 
          s.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5) // Limit to 5 suggestions
        setFilteredSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
        setSelectedIndex(-1)
      } else {
        setShowSuggestions(false)
        setFilteredSuggestions([])
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
            const selected = filteredSuggestions[selectedIndex]
            if (selected) selectSuggestion(selected)
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setSelectedIndex(-1)
          break
      }
    }

    const selectSuggestion = (suggestion: string) => {
      if (inputRef.current) {
        inputRef.current.value = suggestion
        if (props.onChange) {
          props.onChange({
            target: { value: suggestion }
          } as React.ChangeEvent<HTMLInputElement>)
        }
        if (onSelect) onSelect(suggestion)
      }
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }

    const handleBlur = () => {
      // Delay hiding to allow click on suggestions
      setTimeout(() => setShowSuggestions(false), 150)
    }

    return (
      <div className="relative">
        <input
          ref={inputRef}
          className={cn(
            'flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2',
            className
          )}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          {...props}
          onChange={handleInputChange}
        />
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={cn(
                  'px-3 py-2 cursor-pointer text-sm hover:bg-gray-100',
                  index === selectedIndex && 'bg-gray-100'
                )}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)
Autocomplete.displayName = 'Autocomplete'
