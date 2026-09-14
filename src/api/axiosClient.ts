import axios, { AxiosError } from 'axios'

import type { ApiError } from '@/types/api'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * The single axios instance every request goes through.
 *
 * `withCredentials` lives here and nowhere else: auth is an httpOnly cookie, and a
 * browser silently drops it on a cross-origin request unless this is set. Forgetting
 * it on one call would produce a mystifying 401 on that call alone, so there is
 * exactly one place it can be forgotten.
 */
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/** Endpoints whose 401 is an answer, not a failure. */
const AUTH_PROBE_PATHS = ['/auth/me', '/auth/login', '/auth/register']

/** Set by the router so a 401 can bounce the user to login from outside React. */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

/**
 * Trigger the same login redirect the interceptor uses, for requests that do not go
 * through axios — the streaming chat call, which has to use fetch.
 */
export function notifyUnauthorized(): void {
  onUnauthorized?.()
}

function extractDetail(error: AxiosError<{ detail?: unknown }>): string {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') return detail
  // FastAPI's 422 puts a list of field errors here rather than a string.
  if (Array.isArray(detail)) return 'Please check the details you entered.'
  if (!error.response) {
    return 'Cannot reach the server. Is the backend running?'
  }
  return error.message || 'Something went wrong.'
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status ?? 0
    const url = error.config?.url ?? ''

    // A 401 means the session is gone. Redirect — except on the auth endpoints,
    // where a 401 is the expected way of saying "not logged in" or "wrong password".
    if (status === 401 && !AUTH_PROBE_PATHS.some((path) => url.startsWith(path))) {
      onUnauthorized?.()
    }

    const apiError: ApiError = { status, detail: extractDetail(error) }
    return Promise.reject(apiError)
  },
)
