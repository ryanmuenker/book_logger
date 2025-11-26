import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders with default styles', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText(/default/i)
    expect(badge).toHaveClass('bg-gray-100 text-gray-800')
  })

  it('applies learning variant styles', () => {
    render(<Badge variant="learning">Learning</Badge>)
    const badge = screen.getByText(/learning/i)
    expect(badge).toHaveClass('bg-yellow-100 text-yellow-800')
  })
})


