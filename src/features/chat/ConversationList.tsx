import { formatDistanceToNow } from 'date-fns'
import { MessageSquarePlus, MessagesSquare, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useConversationsQuery, useDeleteConversationMutation } from '@/api/chatApi'
import { useAppDispatch } from '@/app/hooks'
import { Spinner } from '@/components/ui/Spinner'
import {
  conversationOpened,
  newConversationStarted,
  panelClosed,
} from '@/features/chat/chatUiSlice'
import { cn } from '@/lib/cn'
import { toUserMessage } from '@/lib/errors'
import type { Conversation } from '@/types/api'

export function ConversationList() {
  const dispatch = useAppDispatch()
  const { data: conversations, isLoading, isError, error } = useConversationsQuery()

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Your chats</h2>
          <p className="text-xs text-slate-500">
            {conversations?.length
              ? `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`
              : 'Travel assistant'}
          </p>
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

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="size-6 text-slate-300" />
          </div>
        ) : isError ? (
          <p className="p-6 text-center text-sm text-slate-500">{toUserMessage(error)}</p>
        ) : conversations && conversations.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {conversations.map((conversation) => (
              <ConversationRow key={conversation.id} conversation={conversation} />
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={() => dispatch(newConversationStarted())}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5',
            'bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700',
          )}
        >
          <MessageSquarePlus className="size-4" />
          New chat
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
        <MessagesSquare className="size-5 text-slate-400" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">No chats yet</p>
      <p className="mt-1 text-xs text-slate-500">
        Start one to ask about flights or cancellation policies.
      </p>
    </div>
  )
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const dispatch = useAppDispatch()
  const [deleteConversation, { isLoading: isDeleting }] = useDeleteConversationMutation()
  // Confirmation lives on the row rather than in a modal: a 400px panel has no room
  // for a dialog, and the destructive action is small enough not to warrant one.
  const [isConfirming, setIsConfirming] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteConversation(conversation.id).unwrap()
      toast.success('Conversation deleted')
    } catch (error) {
      toast.error(toUserMessage(error))
      setIsConfirming(false)
    }
  }

  if (isConfirming) {
    return (
      <li className="flex items-center justify-between gap-2 bg-red-50 px-4 py-3">
        <span className="text-sm text-red-900">Delete this chat?</span>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isDeleting}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-white"
          >
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => dispatch(conversationOpened(conversation.id))}
        className="w-full px-4 py-3 pr-11 text-left transition-colors hover:bg-slate-50"
      >
        <p className="line-clamp-2 text-sm font-medium text-slate-800">
          {conversation.title}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {formatDistanceToNow(new Date(conversation.last_message_at), {
            addSuffix: true,
          })}
        </p>
      </button>

      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        aria-label={`Delete conversation: ${conversation.title}`}
        className={cn(
          'absolute top-3 right-3 rounded-lg p-1.5 text-slate-400 transition',
          'hover:bg-red-50 hover:text-red-600',
          // Hidden until hover on a mouse, always visible on touch where there is
          // no hover to reveal it.
          'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100',
        )}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}
