import * as React from "react"
import { cn } from "../../lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'new' | 'learning' | 'review' | 'mastered' | 'advanced'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-gray-100 text-gray-800",
    secondary: "border-transparent bg-gray-100 text-gray-800",
    destructive: "border-transparent bg-red-100 text-red-800",
    outline: "border-gray-300 text-gray-700",
    new: "border-transparent bg-blue-100 text-blue-800",
    learning: "border-transparent bg-yellow-100 text-yellow-800",
    review: "border-transparent bg-orange-100 text-orange-800",
    mastered: "border-transparent bg-green-100 text-green-800",
    advanced: "border-transparent bg-purple-100 text-purple-800",
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge }
