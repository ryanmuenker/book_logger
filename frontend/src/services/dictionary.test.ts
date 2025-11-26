import { afterEach, describe, expect, it, vi } from 'vitest'
import * as dictionary from './dictionary'

const sampleApiResponse = [
  {
    word: 'example',
    phonetic: '/ˈɛɡzæmpəl/',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'A representative form or pattern.',
            example: 'This sentence is an example.',
            synonyms: ['instance'],
          },
        ],
      },
    ],
  },
]

function mockFetchResponse(data: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }) as unknown as typeof fetch)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('fetchDefinition', () => {
  it('normalizes a successful response', async () => {
    mockFetchResponse(sampleApiResponse)
    const result = await dictionary.fetchDefinition(' Example ')

    expect(result).toEqual({
      word: 'example',
      phonetic: '/ˈɛɡzæmpəl/',
      meanings: [
        {
          partOfSpeech: 'noun',
          definitions: [
            {
              definition: 'A representative form or pattern.',
              example: 'This sentence is an example.',
              synonyms: ['instance'],
            },
          ],
        },
      ],
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('returns null for missing entries', async () => {
    mockFetchResponse([], 200)
    expect(await dictionary.fetchDefinition('unknown')).toBeNull()
  })

  it('returns null on 404 errors', async () => {
    mockFetchResponse({}, 404)
    expect(await dictionary.fetchDefinition('bad')).toBeNull()
  })
})

describe('getFirstDefinition', () => {
  it('returns the first definition string', async () => {
    mockFetchResponse(sampleApiResponse)
    await expect(dictionary.getFirstDefinition('example')).resolves.toBe(
      'A representative form or pattern.'
    )
  })

  it('returns null when no data is available', async () => {
    mockFetchResponse([], 200)
    await expect(dictionary.getFirstDefinition('missing')).resolves.toBeNull()
  })
})

describe('formatDefinition', () => {
  it('creates a readable definition block', () => {
    const formatted = dictionary.formatDefinition({
      word: 'example',
      meanings: [
        {
          partOfSpeech: 'noun',
          definitions: [
            { definition: 'Meaning one', example: 'Use case', synonyms: [] },
            { definition: 'Meaning two' },
          ],
        },
      ],
    })

    expect(formatted).toContain('noun')
    expect(formatted).toContain('1. Meaning one')
    expect(formatted).toContain('Example: "Use case"')
  })
})

