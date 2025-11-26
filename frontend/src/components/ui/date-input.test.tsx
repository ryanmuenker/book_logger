import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DateInput } from './date-input'

describe('DateInput', () => {
  it('auto-formats typed digits into YYYY-MM-DD', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<DateInput onChange={handleChange} />)

    const input = screen.getByPlaceholderText(/yyyy-?mm-?dd/i)
    await user.type(input, '20240109')

    expect(input).toHaveValue('2024-01-09')
    expect(handleChange).toHaveBeenCalled()
    const lastEvent = handleChange.mock.calls.at(-1)?.[0] as { target: { value: string } }
    expect(lastEvent.target.value).toBe('2024-01-09')
  })
})

