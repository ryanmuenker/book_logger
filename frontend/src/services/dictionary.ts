// Dictionary API service using Free Dictionary API
// Alternative: WordsAPI, Oxford Dictionary API, etc.

export type DictionaryResult = {
  word: string
  phonetic?: string
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
      synonyms?: string[]
    }>
  }>
}

export async function fetchDefinition(word: string): Promise<DictionaryResult | null> {
  if (!word.trim()) return null
  
  const cleanWord = word.trim().toLowerCase()
  
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        // Word not found
        return null
      }
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }
    
    const entry = data[0]
    
    return {
      word: entry.word,
      phonetic: entry.phonetic,
      meanings: entry.meanings.map((meaning: any) => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions: meaning.definitions.map((def: any) => ({
          definition: def.definition,
          example: def.example,
          synonyms: def.synonyms
        }))
      }))
    }
  } catch (error) {
    console.error('Dictionary API error:', error)
    return null
  }
}

// Helper to get the first definition as a simple string
export async function getFirstDefinition(word: string): Promise<string | null> {
  const result = await fetchDefinition(word)
  if (!result || !result.meanings.length) return null
  
  const firstMeaning = result.meanings[0]
  if (!firstMeaning.definitions.length) return null
  
  return firstMeaning.definitions[0].definition
}

// Helper to format a full definition nicely
export function formatDefinition(result: DictionaryResult): string {
  if (!result.meanings.length) return ''
  
  const parts: string[] = []
  
  result.meanings.forEach((meaning, index) => {
    if (index > 0) parts.push('') // Add spacing between meanings
    
    parts.push(`${meaning.partOfSpeech}`)
    
    meaning.definitions.forEach((def, defIndex) => {
      if (defIndex < 3) { // Limit to first 3 definitions
        parts.push(`${defIndex + 1}. ${def.definition}`)
        if (def.example) {
          parts.push(`   Example: "${def.example}"`)
        }
      }
    })
  })
  
  return parts.join('\n')
}
