import { MessageCircle } from 'lucide-react'
import { useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { ChatPanel } from '@/features/chat/ChatPanel'
import { panelClosed, panelToggled } from '@/features/chat/chatUiSlice'
import { cn } from '@/lib/cn'

/** The floating launcher, plus the panel it opens. */
export function ChatWidget() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((state) => state.chatUi.isPanelOpen)

  // Escape closes the panel — expected of anything that overlays the page.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(panelClosed())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, dispatch])

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-label="Travel assistant chat"
          className={cn(
            'fixed z-40',
            // Full screen on a phone; a panel in the corner from sm upwards.
            'inset-0 sm:inset-auto sm:right-6 sm:bottom-24',
            'sm:h-[min(600px,calc(100vh-8rem))] sm:w-[400px]',
          )}
        >
          <ChatPanel />
        </div>
      )}

      <button
        type="button"
        onClick={() => dispatch(panelToggled())}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close travel assistant' : 'Open travel assistant'}
        className={cn(
          'fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center',
          'rounded-full bg-brand-600 text-white shadow-lg transition-all',
          'hover:bg-brand-700 hover:shadow-xl active:scale-95',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          // Hidden behind the full-screen panel on mobile, where the header's own
          // close button is the way out.
          isOpen && 'max-sm:hidden',
        )}
      >
        <MessageCircle className="size-6" />
      </button>
    </>
  )
}
