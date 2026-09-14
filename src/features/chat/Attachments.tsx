import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ChevronDown, FileText, Plane } from 'lucide-react'
import { useState } from 'react'

import type { Attachment, FlightCard, PolicySource } from '@/types/api'

/** Cards shown before "Show more" — five full cards crowd a 400px panel. */
const FLIGHTS_SHOWN_INITIALLY = 3

/** Flight cards and cited sources, rendered from the tool's own data. */
export function MessageAttachments({ items }: { items: Attachment[] }) {
  return (
    <div className="w-full max-w-[85%] space-y-2">
      {items.map((item, index) => {
        if (item.kind === 'flights') {
          return (
            <FlightResults key={index} offers={item.offers} totalFound={item.total_found} />
          )
        }
        if (item.kind === 'sources') {
          return <SourceList key={index} sources={item.sources} />
        }
        // A kind a newer backend sends that this build does not know yet.
        return null
      })}
    </div>
  )
}

function FlightResults({ offers, totalFound }: { offers: FlightCard[]; totalFound: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visible = isExpanded ? offers : offers.slice(0, FLIGHTS_SHOWN_INITIALLY)
  const hiddenCount = offers.length - visible.length

  return (
    <div className="space-y-1.5">
      {visible.map((offer) => (
        <FlightCardView key={offer.offer_id} offer={offer} />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1 px-1 text-xs font-medium text-brand-700 hover:underline"
        >
          <ChevronDown className="size-3.5" aria-hidden="true" />
          Show {hiddenCount} more
        </button>
      )}
      {totalFound > offers.length && (
        <p className="px-1 text-xs text-slate-400">
          Cheapest {offers.length} of {totalFound} offers found
        </p>
      )}
    </div>
  )
}

function FlightCardView({ offer }: { offer: FlightCard }) {
  const details = [formatDuration(offer.duration_minutes), formatStops(offer.stops)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-800">
          <Plane className="size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
          <span className="truncate">
            {offer.airline_name ?? offer.airline_code ?? 'Airline'}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
          {formatPrice(offer.total_amount, offer.currency)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
        <span>
          {offer.origin} {formatTime(offer.departure_at)}
        </span>
        <span aria-hidden="true">→</span>
        <span>
          {offer.destination} {formatTime(offer.arrival_at)}
          <DayOffset days={dayOffset(offer.departure_at, offer.arrival_at)} />
        </span>
        <span className="ml-auto">{details}</span>
      </div>
    </div>
  )
}

/**
 * "+1" after an arrival that lands on a later calendar day, the way tickets show it.
 *
 * Without it an overnight flight reads as landing before it took off: 19:10 → 07:55.
 */
function DayOffset({ days }: { days: number }) {
  if (days === 0) return null

  const spoken =
    days === 1
      ? 'next day'
      : days === -1
        ? 'previous day'
        : days > 0
          ? `${days} days later`
          : `${-days} days earlier`

  return (
    <>
      <sup aria-hidden="true" className="ml-0.5 font-semibold text-amber-700">
        {days > 0 ? `+${days}` : `−${-days}`}
      </sup>
      <span className="sr-only">, arrives {spoken}</span>
    </>
  )
}

/**
 * Calendar days between departure and arrival, each read in its own airport's local
 * time — which is what "+1" means on a ticket. Both times arrive with no UTC offset,
 * so comparing their dates needs no timezone conversion, even across timezones.
 */
function dayOffset(departure: string, arrival: string): number {
  const days = differenceInCalendarDays(parseISO(arrival), parseISO(departure))
  // An unreadable timestamp gives NaN; show no marker rather than a wrong one.
  return Number.isFinite(days) ? days : 0
}

function SourceList({ sources }: { sources: PolicySource[] }) {
  if (sources.length === 0) return null

  // One entry per document, pages together: "Flight cancellation policy, pp. 1, 3".
  const pagesByDocument = new Map<string, number[]>()
  for (const source of sources) {
    const pages = pagesByDocument.get(source.file) ?? []
    if (source.page !== null && !pages.includes(source.page)) pages.push(source.page)
    pagesByDocument.set(source.file, pages)
  }

  const entries = [...pagesByDocument].map(([file, pages]) => {
    const name = documentName(file)
    if (pages.length === 0) return name
    const sorted = [...pages].sort((a, b) => a - b)
    return `${name}, ${sorted.length === 1 ? 'p.' : 'pp.'} ${sorted.join(', ')}`
  })

  return (
    <p className="flex items-start gap-1.5 px-1 text-xs text-slate-500">
      <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium text-slate-600">Sources: </span>
        {entries.join(' · ')}
      </span>
    </p>
  )
}

/** "flight_cancellation_policy.pdf" → "Flight cancellation policy". */
function documentName(file: string): string {
  const base = file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function formatPrice(amount: string, currency: string): string {
  // Converted to a number only to format it for display — never for arithmetic.
  const value = Number(amount)
  if (!Number.isFinite(value)) return `${amount} ${currency}`
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  } catch {
    // An unrecognised currency code: show it as sent rather than failing the card.
    return `${amount} ${currency}`
  }
}

function formatTime(value: string): string {
  // Airport-local time with no UTC offset. parseISO reads it as local time and format
  // writes it back unchanged, so no timezone shift is introduced.
  try {
    return format(parseISO(value), 'HH:mm')
  } catch {
    return value
  }
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

function formatStops(stops: number): string {
  if (stops === 0) return 'Direct'
  return stops === 1 ? '1 stop' : `${stops} stops`
}
