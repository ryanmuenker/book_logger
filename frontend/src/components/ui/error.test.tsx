import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Error } from './error'

describe('Error component', () => {
  it('renders the provided error message', () => {
    render(<Error error="Something went wrong" />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
  })

  it('calls retry handler when provided', () => {
    const onRetry = vi.fn()
    render(<Error error="Oops" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})


