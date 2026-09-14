import { skipToken } from '@reduxjs/toolkit/query'
import { ArrowLeft, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useConversationQuery } from '@/api/chatApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Spinner } from '@/components/ui/Spinner'
import { AgentProgress } from '@/features/chat/AgentProgress'
import { MessageAttachments } from '@/features/chat/Attachments'
import { ChatComposer } from '@/features/chat/ChatComposer'
import { ChatMessage, type ChatMessageData } from '@/features/chat/ChatMessage'
import {
  conversationIdAssigned,
  listOpened,
  panelClosed,
} from '@/features/chat/chatUiSlice'
import { useStreamingAsk } from '@/features/chat/useStreamingAsk'
import { toUserMessage } from '@/lib/errors'

const SUGGESTIONS = [
  'What fee do I pay if I cancel 30 hours before departure?',
  'Find flights from Delhi to Goa next Friday',
  'How long do refunds take?',
]

export function ConversationView() {
  const dispatch = useAppDispatch()
  const conversationId = useAppSelector((state) => state.chatUi.activeConversationId)
  const {
    send: streamAsk,
    isSending,
    steps,
    attachments: earlyAttachments,
  } = useStreamingAsk()

  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Which conversation's history has already been loaded into `messages`. Without
  // this, every background refetch would overwrite the thread mid-conversation and
  // wipe any error notices the user is still reading.
  const loadedIdRef = useRef<string | null>(null)

  const { data: stored, isFetching } = useConversationQuery(
    conversationId ?? skipToken,
  )

  useEffect(() => {
    if (!stored || loadedIdRef.current === stored.id) return
    loadedIdRef.current = stored.id
    setMessages(
      stored.messages.map((message, index) => ({
        id: `${stored.id}-${index}`,
        role: message.role,
        content: message.content,
        attachments: message.attachments,
      })),
    )
  }, [stored])

  const isStreamingReply = messages.some((message) => message.isStreaming)

  // Follow the newest content: each token, each progress step, each early result.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      block: 'end',
      // Instant while tokens arrive — a smooth scroll per token queues up and lags
      // visibly behind the text.
      behavior: isStreamingReply ? 'auto' : 'smooth',
    })
  }, [messages, isSending, steps, earlyAttachments, isStreamingReply])

  const send = async (question: string) => {
    const sentAt = Date.now()
    const replyId = `assistant-${sentAt}`
    setMessages((current) => [
      ...current,
      { id: `user-${sentAt}`, role: 'user', content: question },
    ])

    // Create the reply bubble on the first token, then grow it in place. Until then
    // the progress list is shown instead of an empty bubble.
    const updateReply = (update: (reply: ChatMessageData) => ChatMessageData) =>
      setMessages((current) => {
        const index = current.findIndex((message) => message.id === replyId)
        if (index === -1) {
          return [
            ...current,
            update({ id: replyId, role: 'assistant', content: '', isStreaming: true }),
          ]
        }
        const next = [...current]
        next[index] = update(next[index]!)
        return next
      })

    try {
      const result = await streamAsk(
        {
          question,
          // Omitted on the first question, which is how the backend knows to start a
          // new conversation and mint an id.
          ...(conversationId ? { conversation_id: conversationId } : {}),
        },
        {
          onToken: (delta) =>
            updateReply((reply) => ({ ...reply, content: reply.content + delta })),
          onReset: () =>
            setMessages((current) => current.filter((message) => message.id !== replyId)),
        },
      )

      // The server's `answer` is authoritative: it is exactly the text after the last
      // tool call, which is what gets saved to the conversation. The early results move
      // onto the reply here, which is where they come back when the chat is reopened.
      updateReply((reply) => ({
        ...reply,
        content: result.answer || reply.content,
        isStreaming: false,
        attachments: result.attachments.length > 0 ? result.attachments : undefined,
      }))

      if (!conversationId) {
        // Claim the new id before its history arrives, so the effect above treats this
        // conversation as already loaded and leaves the messages alone.
        loadedIdRef.current = result.conversation_id
        dispatch(conversationIdAssigned(result.conversation_id))
      }
    } catch (error) {
      // A reply cut off mid-sentence is removed rather than left looking complete, and
      // the failure is shown in the conversation — a question that silently produced
      // nothing is worse than one that visibly failed.
      setMessages((current) => [
        ...current.filter((message) => message.id !== replyId),
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: toUserMessage(error),
          isError: true,
        },
      ])
    }
  }

  const isLoadingHistory = isFetching && loadedIdRef.current !== conversationId

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-slate-200">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-3">
        <button
          type="button"
          onClick={() => dispatch(listOpened())}
          aria-label="Back to all chats"
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-900">
            {stored?.title ?? 'New chat'}
          </h2>
          <p className="text-xs text-slate-500">Flights and cancellation policies</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(panelClosed())}
          aria-label="Close chat"
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="size-6 text-slate-300" />
          </div>
        ) : messages.length === 0 && !isSending ? (
          <div className="pt-6">
            <p className="mb-3 text-center text-sm text-slate-500">
              Ask me anything about your trip.
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="block w-full rounded-lg bg-white px-3 py-2 text-left text-sm text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => <ChatMessage key={message.id} {...message} />)
        )}

        {/* Shown for the whole wait, and replaced by the reply once it starts. */}
        {isSending && !isStreamingReply && <AgentProgress steps={steps} />}

        {/* Results that arrived before the answer — flight cards are ready several
            seconds before Gemini has finished writing about them. */}
        {isSending && earlyAttachments.length > 0 && (
          <div className="flex justify-start">
            <MessageAttachments items={earlyAttachments} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer onSend={(question) => void send(question)} isSending={isSending} />
    </div>
  )
}
