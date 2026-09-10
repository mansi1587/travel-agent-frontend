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

export interface Message {
  role: MessageRole
  content: string
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
