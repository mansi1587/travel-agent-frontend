import { forwardRef, useId, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

/**
 * `forwardRef` matters here: react-hook-form registers the field by attaching a ref,
 * and without it validation would silently never see the value.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'block w-full rounded-lg px-3 py-2.5 text-sm text-slate-900',
          'ring-1 ring-slate-300 ring-inset placeholder:text-slate-400',
          'focus:ring-2 focus:ring-brand-600 focus:outline-none',
          error && 'ring-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})
