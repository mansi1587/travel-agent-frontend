import { API_BASE_URL, notifyUnauthorized } from '@/api/axiosClient'
import type { ApiError, AskRequest, StreamEvent } from '@/types/api'

function apiError(status: number, detail: string): ApiError {
  return { status, detail }
}

async function readDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'detail' in body) {
      const { detail } = body
      if (typeof detail === 'string') return detail
      // FastAPI's 422 puts a list of field errors here rather than a string.
      if (Array.isArray(detail)) return 'Please check the details you entered.'
    }
  } catch {
    // Not JSON — fall back to the status text below.
  }
  return response.statusText || 'Something went wrong.'
}

/** Parse one SSE block and hand its payload on. */
function emit(block: string, onEvent: (event: StreamEvent) => void): void {
  // The server duplicates the event name inside the JSON, so only the data line matters.
  const dataLine = block.split('\n').find((line) => line.startsWith('data: '))
  if (!dataLine) return

  let event: StreamEvent
  try {
    event = JSON.parse(dataLine.slice('data: '.length)) as StreamEvent
  } catch {
    // A malformed event is dropped rather than failing a reply that is otherwise fine.
    return
  }
  onEvent(event)
}

/**
 * POST /chat/stream, delivering each server-sent event as it arrives.
 *
 * Plain fetch rather than axios or EventSource: axios in the browser cannot read a
 * response body incrementally, and EventSource can only make GET requests, so it has
 * no way to send the question. `credentials: "include"` is set here for the same reason
 * `withCredentials` is on the axios instance — without it the auth cookie is not sent.
 *
 * Throws an ApiError if the request is refused before streaming starts (401, 404, 422).
 * Failures after that arrive as an `error` event instead, because by then the response
 * status is already 200.
 */
export async function streamChat(
  request: AskRequest,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(request),
    })
  } catch {
    throw apiError(0, 'Cannot reach the server. Is the backend running?')
  }

  if (!response.ok) {
    if (response.status === 401) notifyUnauthorized()
    throw apiError(response.status, await readDetail(response))
  }
  if (!response.body) {
    throw apiError(0, 'The reply could not be read. Please try again.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break

    // Normalised on the whole buffer, not per chunk, so a \r\n split across two
    // network chunks is still caught.
    buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n')

    // Events end with a blank line. Anything after the last one is incomplete and
    // waits for the next chunk.
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      emit(buffer.slice(0, boundary), onEvent)
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) emit(buffer, onEvent)
}
