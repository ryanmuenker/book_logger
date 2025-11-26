import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Loading } from './loading'

describe('Loading component', () => {
  it('renders default text and size', () => {
    render(<Loading />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-6 w-6')
  })

  it('supports custom size and text', () => {
    render(<Loading size="lg" text="Fetching data" />)
    expect(screen.getByText(/fetching data/i)).toBeInTheDocument()
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8 w-8')
  })
})

