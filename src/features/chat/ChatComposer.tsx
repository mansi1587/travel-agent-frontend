import { Send } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'

interface ChatComposerProps {
  onSend: (question: string) => void
  isSending: boolean
}

const MAX_TEXTAREA_HEIGHT_PX = 128

export function ChatComposer({ onSend, isSending }: ChatComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Grow with the text instead of scrolling inside a one-line box.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`
  }, [value])

  // Put the cursor back in the box once a reply lands, so the next question can be
  // typed straight away.
  useEffect(() => {
    if (!isSending) textareaRef.current?.focus()
  }, [isSending])

  const submit = () => {
    const question = value.trim()
    if (!question || isSending) return
    onSend(question)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter is a newline. Without the first check, choosing a
    // word from an IME's suggestion list would send the message.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div
        className={cn(
          'flex items-end gap-2 rounded-xl bg-slate-50 p-2',
          'ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-brand-600',
        )}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          // Disabled while in flight so a second question cannot be queued behind
          // the first — the backend answers one conversation turn at a time.
          disabled={isSending}
          placeholder={isSending ? 'Waiting for a reply…' : 'Ask about flights or policies…'}
          aria-label="Your question"
          className={cn(
            'max-h-32 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm',
            'placeholder:text-slate-400 focus:outline-none disabled:opacity-60',
          )}
        />
        <button
          type="button"
          onClick={submit}
          disabled={isSending || value.trim().length === 0}
          aria-label="Send message"
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            'bg-brand-600 text-white transition-colors hover:bg-brand-700',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          {isSending ? <Spinner className="size-4" /> : <Send className="size-4" />}
        </button>
      </div>
      <p className="mt-1.5 px-1 text-xs text-slate-400">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  )
}
