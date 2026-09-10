import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes, letting later ones win.
 *
 * Plain string concatenation leaves both `px-4` and `px-8` in the class list and the
 * winner depends on stylesheet order, which makes overriding a component's padding
 * from outside unreliable. twMerge resolves the conflict properly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
