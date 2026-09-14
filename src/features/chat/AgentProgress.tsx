import { Check, Loader2 } from 'lucide-react'

import type { AgentStep } from '@/features/chat/useStreamingAsk'
import { cn } from '@/lib/cn'

/**
 * What the agent is doing while you wait, as a running checklist.
 *
 * Finished steps stay on screen ticked rather than disappearing: a policy search takes
 * under a second and would otherwise flash past before it could be read. The longest
 * wait usually comes after the last tool — Gemini writing the answer, measured at 11
 * seconds for a flight search — so that phase gets its own line instead of bare dots.
 */
export function AgentProgress({ steps }: { steps: AgentStep[] }) {
  const allToolsDone = steps.length > 0 && steps.every((step) => step.isDone)

  return (
    <div className="flex justify-start">
      <ul
        role="status"
        aria-live="polite"
        className="space-y-1.5 rounded-2xl bg-white px-3.5 py-2.5 text-xs ring-1 ring-slate-200"
      >
        {/* Before any tool runs, Gemini is deciding what the question needs. */}
        {steps.length === 0 && <ProgressRow label="Thinking" isActive />}
        {steps.map((step, index) => (
          <ProgressRow
            key={`${step.tool}-${index}`}
            label={step.label}
            isActive={!step.isDone}
          />
        ))}
        {allToolsDone && <ProgressRow label="Writing the answer" isActive />}
      </ul>
    </div>
  )
}

function ProgressRow({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2',
        isActive ? 'font-medium text-brand-700' : 'text-slate-500',
      )}
    >
      {isActive ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
      )}
      <span>{isActive ? `${label}…` : label}</span>
    </li>
  )
}
