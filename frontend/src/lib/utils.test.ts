import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges conditional class names', () => {
    const result = cn('px-2', ['text-sm', { hidden: false }], { block: true }, 'px-4')
    expect(result).toBe('text-sm block px-4')
  })
})

