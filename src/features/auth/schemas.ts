import { z } from 'zod'

// Matches the backend's own validation: FastAPI rejects a password under 8
// characters with a 422, so catching it here avoids a pointless round trip.
const password = z.string().min(8, 'Password must be at least 8 characters')

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.email('Enter a valid email address'),
  password,
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
