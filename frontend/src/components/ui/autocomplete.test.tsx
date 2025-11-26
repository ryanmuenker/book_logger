import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Autocomplete } from './autocomplete'

describe('Autocomplete', () => {
  it('filters suggestions and notifies selection', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()

    render(
      <Autocomplete
        placeholder="Word"
        suggestions={['Apple', 'Banana', 'Apricot']}
        onSelect={handleSelect}
      />
    )

    const input = screen.getByPlaceholderText(/word/i)
    await user.type(input, 'ap')

    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Apricot')).toBeInTheDocument()

    await user.keyboard('{ArrowDown}{Enter}')

    expect(handleSelect).toHaveBeenCalledWith('Apple')
    expect(input).toHaveValue('Apple')
  })
})


