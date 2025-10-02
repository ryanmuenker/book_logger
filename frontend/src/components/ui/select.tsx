import * as React from 'react'
import { cn } from '../../lib/cn'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('h-9 rounded-md border bg-transparent px-2 py-2 text-sm shadow-sm', className)} {...props} />
}


