import { FileText, LogOut, MessageCircle, Plane } from 'lucide-react'
import { toast } from 'sonner'

import { useLogoutMutation } from '@/api/authApi'
import { useAppDispatch } from '@/app/hooks'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/features/auth/useSession'
import { ChatWidget } from '@/features/chat/ChatWidget'
import { newConversationStarted } from '@/features/chat/chatUiSlice'
import { toUserMessage } from '@/lib/errors'

const CAPABILITIES = [
  {
    icon: Plane,
    title: 'Find flights',
    body: 'Real fares between any two airports, cheapest first.',
  },
  {
    icon: FileText,
    title: 'Answer policy questions',
    body: 'Cancellation fees, refunds and timings, quoted from the policy documents.',
  },
]

export function WelcomePage() {
  const dispatch = useAppDispatch()
  const { user } = useSession()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-600">
              <Plane className="size-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Travel Assistant</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={isLoggingOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-slate-900">
          Welcome{user ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-2 text-slate-600">
          Ask about flights or cancellation policies, and I&apos;ll look them up for you.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl bg-white p-5 ring-1 ring-slate-200"
            >
              <Icon className="size-5 text-brand-600" />
              <h2 className="mt-3 font-medium text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>

        <Button className="mt-10" onClick={() => dispatch(newConversationStarted())}>
          <MessageCircle className="size-4" />
          Start a conversation
        </Button>
      </main>

      <ChatWidget />
    </div>
  )
}
