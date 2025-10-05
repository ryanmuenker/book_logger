import * as React from 'react'
import { cn } from '../../lib/cn'

export interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, placeholder = "YYYY-MM-DD", ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || '')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      
      // Allow only numbers and dashes
      const cleaned = input.replace(/[^\d-]/g, '')
      
      // Auto-format as user types
      let formatted = cleaned
      if (cleaned.length >= 4 && !cleaned.includes('-')) {
        // Add first dash after year
        formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4)
      }
      if (formatted.length >= 7 && formatted.split('-').length === 2) {
        // Add second dash after month
        const parts = formatted.split('-')
        if (parts[1].length >= 2) {
          formatted = parts[0] + '-' + parts[1].slice(0, 2) + '-' + parts[1].slice(2)
        }
      }
      
      // Limit to YYYY-MM-DD format
      if (formatted.length > 10) {
        formatted = formatted.slice(0, 10)
      }
      
      setValue(formatted)
      if (props.onChange) {
        props.onChange({ ...e, target: { ...e.target, value: formatted } })
      }
    }

    return (
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2',
          className
        )}
        {...props}
      />
    )
  }
)
DateInput.displayName = 'DateInput'
