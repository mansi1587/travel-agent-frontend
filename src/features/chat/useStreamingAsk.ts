import { useCallback, useState } from 'react'

import { chatApi, useAskMutation } from '@/api/chatApi'
import { streamChat } from '@/api/streamChat'
import { useAppDispatch } from '@/app/hooks'
import { isApiError } from '@/lib/errors'
import type { ApiError, AskRequest, AskResponse, Attachment } from '@/types/api'

/** One thing the agent did while answering, e.g. "Checking flight details". */
export interface AgentStep {
  tool: string
  label: string
  isDone: boolean
}

export interface StreamResult extends AskResponse {
  /** Structured results gathered while the tools ran — flight cards, cited sources. */
  attachments: Attachment[]
}

interface StreamHandlers {
  /** A piece of the reply, to append to what is on screen. */
  onToken: (delta: string) => void
  /** Discard what has streamed so far: the model was thinking aloud before a tool ran. */
  onReset: () => void
}

/**
 * Failures worth retrying without streaming: the stream never got going, or the server
 * broke before it started. A 401, 404 or 429 would come back identically from
 * /chat/ask, so retrying those would only double the wait.
 */
function isTransportFailure(error: unknown): boolean {
  return isApiError(error) && (error.status === 0 || error.status >= 500)
}

/**
 * Ask a question and receive the answer as it is produced.
 *
 * Shaped like the RTK Query mutation it replaces — `send` resolves to the full answer
 * or throws an ApiError — so the component using it barely changes.
 */
export function useStreamingAsk() {
  const dispatch = useAppDispatch()
  const [askWithoutStreaming] = useAskMutation()
  const [isSending, setIsSending] = useState(false)
  /**
   * Every tool the agent has run for the current question, finished ones included.
   * Kept as a list rather than "the tool running now": a fast tool (a policy search
   * takes under a second) would otherwise appear and vanish before it could be read.
   */
  const [steps, setSteps] = useState<AgentStep[]>([])
  /**
   * Results that arrived before the answer did. A flight search finishes several
   * seconds before Gemini has written about it, so its cards can be shown early.
   */
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const send = useCallback(
    async (request: AskRequest, { onToken, onReset }: StreamHandlers): Promise<StreamResult> => {
      setIsSending(true)
      setSteps([])
      setAttachments([])

      // A holder object rather than plain `let`s: TypeScript cannot see assignments made
      // inside the event callback, and would otherwise narrow these to null permanently.
      const outcome: {
        receivedAny: boolean
        result: AskResponse | null
        failure: ApiError | null
        attachments: Attachment[]
      } = { receivedAny: false, result: null, failure: null, attachments: [] }

      try {
        try {
          await streamChat(request, (event) => {
            outcome.receivedAny = true
            switch (event.event) {
              case 'token':
                onToken(event.delta)
                break
              case 'tool_start': {
                onReset()
                const step: AgentStep = { tool: event.tool, label: event.label, isDone: false }
                setSteps((current) => [...current, step])
                break
              }
              case 'tool_end': {
                const tool = event.tool
                const result = event.result
                setSteps((current) => {
                  // The same tool can run twice in one answer; tick the latest unfinished one.
                  const index = current.findLastIndex(
                    (step) => step.tool === tool && !step.isDone,
                  )
                  if (index === -1) return current
                  const next = [...current]
                  next[index] = { ...next[index]!, isDone: true }
                  return next
                })
                if (result) {
                  outcome.attachments.push(result)
                  setAttachments((current) => [...current, result])
                }
                break
              }
              case 'error':
                outcome.failure = { status: event.status, detail: event.detail }
                break
              case 'done':
                outcome.result = {
                  answer: event.answer,
                  conversation_id: event.conversation_id,
                }
                break
            }
          })
        } catch (error) {
          // Retry once without streaming — but only if nothing arrived. Once any event
          // has come back the agent is already running, and a second request would run
          // it again and write the turn to the conversation twice.
          if (outcome.receivedAny || !isTransportFailure(error)) throw error
          outcome.result = await askWithoutStreaming(request).unwrap()
          onToken(outcome.result.answer)
        }

        if (outcome.failure) throw outcome.failure
        if (!outcome.result) {
          throw { status: 0, detail: 'The reply was interrupted. Please try again.' } satisfies ApiError
        }

        // RTK Query cannot see a raw fetch, so it has to be told that the list and this
        // conversation changed — otherwise the sidebar would not reorder itself.
        dispatch(
          chatApi.util.invalidateTags([
            { type: 'Conversation', id: outcome.result.conversation_id },
            { type: 'Conversation', id: 'LIST' },
          ]),
        )
        return { ...outcome.result, attachments: outcome.attachments }
      } finally {
        setIsSending(false)
        setSteps([])
        setAttachments([])
      }
    },
    [askWithoutStreaming, dispatch],
  )

  return { send, isSending, steps, attachments }
}
