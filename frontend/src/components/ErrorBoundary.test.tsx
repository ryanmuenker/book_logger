import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Thrower() {
  throw new Error('Boom')
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>
    )
    expect(screen.getByText(/safe content/i)).toBeInTheDocument()
  })

  it('falls back to default UI when a child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('supports custom fallback components with reset logic', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true)

      return (
        <>
          <ErrorBoundary
            fallback={({ resetError }) => (
              <div>
                <p>Custom fallback</p>
                <button
                  onClick={() => {
                    setShouldThrow(false)
                    resetError()
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          >
            {shouldThrow ? <Thrower /> : <p>Recovered</p>}
          </ErrorBoundary>
        </>
      )
    }

    render(<Harness />)

    expect(screen.getByText(/custom fallback/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/reset/i))

    expect(screen.getByText(/recovered/i)).toBeInTheDocument()
    consoleSpy.mockRestore()
  })
})

