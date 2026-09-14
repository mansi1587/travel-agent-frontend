/** Types mirroring the FastAPI backend's contract. */

export interface Role {
  id: number
  name: string
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AskRequest {
  question: string
  /** Omit to start a new conversation; send it back to continue one. */
  conversation_id?: string
}

export interface AskResponse {
  answer: string
  conversation_id: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  last_message_at: string
}

export type MessageRole = 'user' | 'assistant'

/** One flight offer as sent for display. The price is a string — never a float. */
export interface FlightCard {
  offer_id: string
  airline_name: string | null
  airline_code: string | null
  total_amount: string
  currency: string
  /** Local time at the airport, with no UTC offset: "2026-10-01T20:54:00". */
  departure_at: string
  arrival_at: string
  duration_minutes: number | null
  stops: number
  origin: string
  destination: string
}

export interface PolicySource {
  file: string
  page: number | null
}

/**
 * Structured results shown under an answer. Built from the tool's real data rather
 * than from what the model wrote, so a price or page number cannot be misquoted.
 */
export type Attachment =
  | { kind: 'flights'; total_found: number; offers: FlightCard[] }
  | { kind: 'sources'; sources: PolicySource[] }

export interface Message {
  role: MessageRole
  content: string
  /** Present only on answers that used a tool with something to show. */
  attachments?: Attachment[]
}

export interface ConversationDetail extends Conversation {
  messages: Message[]
}

/**
 * Every failure reaching the UI, in one shape.
 *
 * `status` is 0 when the request never got a response at all — the backend is down,
 * or CORS blocked it — which is worth distinguishing from a real HTTP error.
 */
export interface ApiError {
  status: number
  detail: string
}

/**
 * One event from POST /chat/stream — mirrors StreamEvent in the backend's
 * schemas/chat.py. `error` is an event rather than an HTTP status because by the time
 * a rate limit or upstream failure happens, the 200 response is already streaming.
 */
export type StreamEvent =
  | { event: 'token'; delta: string }
  | { event: 'tool_start'; tool: string; label: string }
  | { event: 'tool_end'; tool: string; result?: Attachment }
  | { event: 'error'; status: number; detail: string }
  | { event: 'done'; conversation_id: string; answer: string }
