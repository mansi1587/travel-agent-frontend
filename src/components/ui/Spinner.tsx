import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('animate-spin', className)}
      role="status"
      aria-label="Loading"
    />
  )
}

/** Shown while the session check runs, so the login page never flashes. */
export function FullPageSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-8 text-brand-600" />
    </div>
  )
}
