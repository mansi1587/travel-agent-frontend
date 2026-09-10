import { MessageSquarePlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useAskMutation } from '@/api/chatApi'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/Button'
import { ChatComposer } from '@/features/chat/ChatComposer'
import {
  ChatMessage,
  TypingIndicator,
  type ChatMessageData,
} from '@/features/chat/ChatMessage'
import {
  conversationCleared,
  conversationOpened,
  panelClosed,
} from '@/features/chat/chatUiSlice'
import { toUserMessage } from '@/lib/errors'

const SUGGESTIONS = [
  'What fee do I pay if I cancel 30 hours before departure?',
  'Find flights from Delhi to Goa next Friday',
  'How long do refunds take?',
]

export function ChatPanel() {
  const dispatch = useAppDispatch()
  const conversationId = useAppSelector((state) => state.chatUi.activeConversationId)
  const [ask, { isLoading: isSending }] = useAskMutation()

  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Follow the newest message, including the typing indicator appearing.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const send = async (question: string) => {
    const sentAt = Date.now()
    setMessages((current) => [
      ...current,
      { id: `user-${sentAt}`, role: 'user', content: question },
    ])

    try {
      const result = await ask({
        question,
        // Omitted on the first question, which is how the backend knows to start a
        // new conversation and mint an id.
        ...(conversationId ? { conversation_id: conversationId } : {}),
      }).unwrap()

      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: result.answer },
      ])
      // The backend mints the id on the first question; hold on to it so the next
      // one continues this conversation instead of starting another.
      if (!conversationId) {
        dispatch(conversationOpened(result.conversation_id))
      }
    } catch (error) {
      // Shown in the conversation rather than only as a toast: a question that
      // silently produced nothing is worse than one that visibly failed.
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: toUserMessage(error),
          isError: true,
        },
      ])
    }
  }

  const startNewConversation = () => {
    dispatch(conversationCleared())
    setMessages([])
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-slate-200">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Travel assistant</h2>
          <p className="text-xs text-slate-500">Flights and cancellation policies</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewConversation}
            disabled={isSending || messages.length === 0}
            aria-label="Start a new conversation"
            title="New conversation"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(panelClosed())}
            aria-label="Close chat"
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !isSending ? (
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

        {isSending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatComposer onSend={(question) => void send(question)} isSending={isSending} />
    </div>
  )
}
