import { AlertCircle } from 'lucide-react'
import Markdown from 'react-markdown'

import { MessageAttachments } from '@/features/chat/Attachments'
import { cn } from '@/lib/cn'
import type { Attachment, MessageRole } from '@/types/api'

export interface ChatMessageData {
  id: string
  role: MessageRole
  content: string
  /** Rendered as a warning rather than an answer. */
  isError?: boolean
  /** Still arriving token by token; shows a cursor at the end. */
  isStreaming?: boolean
  /** Flight cards or cited sources, shown under the answer. */
  attachments?: Attachment[]
}

// Appended to the Markdown source rather than rendered after it, so it sits at the end
// of the last line of text instead of dropping onto a line of its own.
const STREAMING_CURSOR = '▍'

export function ChatMessage({
  role,
  content,
  isError,
  isStreaming,
  attachments,
}: ChatMessageData) {
  const isUser = role === 'user'
  const shownAttachments = isUser || isError ? [] : (attachments ?? [])

  return (
    // A column rather than a row, so cards and sources sit under the bubble they
    // belong to, aligned to the same side.
    <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
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
            <Markdown>{isStreaming ? content + STREAMING_CURSOR : content}</Markdown>
          </div>
        )}
      </div>
      {shownAttachments.length > 0 && <MessageAttachments items={shownAttachments} />}
    </div>
  )
}

