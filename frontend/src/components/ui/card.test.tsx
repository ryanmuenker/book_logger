import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, CardContent, CardHeader, CardTitle } from './card'

describe('Card primitives', () => {
  it('compose card sections with provided content', () => {
    render(
      <Card data-testid="card-root" className="custom">
        <CardHeader data-testid="card-header">
          <CardTitle data-testid="card-title">Title</CardTitle>
        </CardHeader>
        <CardContent data-testid="card-content">Body</CardContent>
      </Card>
    )

    expect(screen.getByTestId('card-root')).toHaveClass('bg-white')
    expect(screen.getByTestId('card-header')).toHaveClass('p-6')
    expect(screen.getByTestId('card-title')).toHaveTextContent('Title')
    expect(screen.getByTestId('card-content')).toHaveTextContent('Body')
  })
})


