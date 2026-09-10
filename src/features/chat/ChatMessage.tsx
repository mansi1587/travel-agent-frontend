import { AlertCircle } from 'lucide-react'
import Markdown from 'react-markdown'

import { cn } from '@/lib/cn'
import type { MessageRole } from '@/types/api'

export interface ChatMessageData {
  id: string
  role: MessageRole
  content: string
  /** Rendered as a warning rather than an answer. */
  isError?: boolean
}

export function ChatMessage({ role, content, isError }: ChatMessageData) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
          isUser && 'bg-brand-600 text-white',
          !isUser && !isError && 'bg-white text-slate-800 ring-1 ring-slate-200',
          isError && 'bg-amber-50 text-amber-900 ring-1 ring-amber-200',
        )}
      >
        {isUser ? (
          // User text is shown verbatim: rendering it as Markdown would mangle
          // anything containing asterisks or underscores.
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : isError ? (
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{content}</span>
          </p>
        ) : (
          // The assistant answers in Markdown — "**20% of the ticket fare**" and
          // bullet lists — so it needs rendering, not printing.
          <div
            className={cn(
              'prose prose-sm max-w-none',
              'prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5',
              'prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-base',
              'prose-strong:text-slate-900 prose-strong:font-semibold',
            )}
          >
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}

/** Shown while the agent works — it calls tools, so replies take 5-15 seconds. */
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
        <div className="flex gap-1" role="status" aria-label="Assistant is typing">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-2 animate-bounce rounded-full bg-slate-400"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
