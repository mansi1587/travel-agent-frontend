import { useAppSelector } from '@/app/hooks'
import { ConversationList } from '@/features/chat/ConversationList'
import { ConversationView } from '@/features/chat/ConversationView'

/**
 * The panel shows one screen at a time, the way a messaging widget does.
 *
 * A permanent side-by-side sidebar would not fit in 400px, so the list and the
 * conversation take turns instead.
 */
export function ChatPanel() {
  const view = useAppSelector((state) => state.chatUi.view)

  return view === 'list' ? <ConversationList /> : <ConversationView />
}
