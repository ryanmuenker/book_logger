import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('applies default styles', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toHaveClass('bg-blue-600 text-white hover:bg-blue-700')
  })

  it('supports alternate variants and sizes', () => {
    render(
      <Button variant="outline" size="lg">
        Outline
      </Button>
    )
    const button = screen.getByRole('button', { name: /outline/i })
    expect(button).toHaveClass('border border-gray-300 bg-transparent hover:bg-gray-50')
    expect(button).toHaveClass('h-10 rounded-md px-8')
  })

  it('can render as a child component', () => {
    render(
      <Button asChild>
        <a href="/next">Next</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /next/i })
    expect(link.tagName).toBe('A')
    expect(link).toHaveClass('bg-blue-600 text-white')
  })
})


