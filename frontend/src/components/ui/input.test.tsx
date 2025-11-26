import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './input'

describe('Input component', () => {
  it('renders with base styles and updates value', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Email" />)

    const input = screen.getByPlaceholderText(/email/i)
    expect(input).toHaveClass('border-gray-300')

    await user.type(input, 'test@example.com')
    expect(input).toHaveValue('test@example.com')
  })
})


