import type { ApiError } from '@/types/api'

const RATE_LIMITED = 429
const BAD_GATEWAY = 502
const GATEWAY_TIMEOUT = 504

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'detail' in error
  )
}

/**
 * Turn a failure into something worth showing a person.
 *
 * The backend's own `detail` is used wherever it is meaningful. The exceptions are
 * the statuses where it describes our infrastructure rather than anything the user
 * can act on.
 */
export function toUserMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Something went wrong. Please try again.'
  }

  switch (error.status) {
    case RATE_LIMITED:
      return 'The assistant is busy right now — please try again in a minute.'
    case BAD_GATEWAY:
    case GATEWAY_TIMEOUT:
      return 'The assistant is temporarily unavailable. Please try again shortly.'
    case 0:
      return 'Cannot reach the server. Is the backend running?'
    default:
      return error.detail
  }
}

/** A 429 clears on its own, so the UI can invite a retry rather than just apologising. */
export function isRetryable(error: unknown): boolean {
  return isApiError(error) && error.status === RATE_LIMITED
}
