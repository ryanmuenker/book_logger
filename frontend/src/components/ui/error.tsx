import { cn } from '../../lib/utils'
import { Button } from './button'

interface ErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

export function Error({ error, onRetry, className }: ErrorProps) {
  return (
    <div className={cn('text-center py-8', className)}>
      <div className="text-red-600 mb-4">{error}</div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
