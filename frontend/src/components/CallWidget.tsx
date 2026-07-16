import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

/**
 * Fixed bottom-right call entry for Conversational AI voice advice.
 */
export function CallWidget() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const onAgentPage = pathname.startsWith('/conversational-ai')

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onPointer(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  // Compact on agent page – still jump-to-call deep link
  if (onAgentPage) {
    return (
      <div className="fixed bottom-5 right-5 z-[60] sm:bottom-7 sm:right-7">
        <a
          href="#call"
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-off-white shadow-[0_12px_40px_-8px_rgba(28,25,23,0.45)] ring-1 ring-white/10 transition hover:scale-[1.04] hover:bg-charcoal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          aria-label="Hoppa till röstsamtal"
          title="Ring smakrådgivare"
        >
          <PhoneIcon className="h-5 w-5" />
        </a>
      </div>
    )
  }

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-[60] sm:bottom-7 sm:right-7">
      {open && (
        <div
          className="mb-3 w-[min(100vw-2.5rem,20rem)] origin-bottom-right animate-call-in rounded-2xl border border-charcoal/10 bg-off-white/95 p-5 shadow-[0_24px_60px_-12px_rgba(28,25,23,0.35)] backdrop-blur-xl"
          role="dialog"
          aria-label="Ring smakrådgivare"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold">
                Smakrådgivning
              </p>
              <h2 className="mt-1 font-display text-xl tracking-tight text-charcoal">
                Ring för smakråd
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-charcoal/40 transition hover:bg-charcoal/5 hover:text-charcoal"
              aria-label="Stäng"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/60">
            Få personliga glassförslag via röst – berätta om tillfälle, favoriter eller allergier.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              to="/conversational-ai?call=1"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-off-white shadow-sm transition hover:bg-charcoal/90"
            >
              <PhoneIcon className="h-4 w-4" />
              Ring nu
            </Link>
            <Link
              to="/conversational-ai"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-charcoal/12 bg-white px-5 py-2.5 text-sm font-medium text-charcoal/80 transition hover:border-charcoal/25 hover:text-charcoal"
            >
              Skriv i stället
            </Link>
          </div>
          <p className="mt-3 text-center text-[10px] tracking-wide text-charcoal/40">
            Powered by ElevenLabs
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`group relative flex items-center gap-3 rounded-full bg-charcoal text-off-white shadow-[0_12px_40px_-8px_rgba(28,25,23,0.45)] ring-1 ring-white/10 transition hover:scale-[1.02] hover:bg-charcoal/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
          open ? 'pl-4 pr-4 py-3.5' : 'pl-4 pr-5 py-3.5'
        }`}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
          <span className="absolute inset-0 animate-ping rounded-full bg-gold/30 opacity-40" />
          <PhoneIcon className="relative h-5 w-5" />
        </span>
        <span className="pr-1 text-left leading-tight">
          <span className="block text-sm font-semibold tracking-tight">Ring oss</span>
          <span className="block text-[11px] font-normal text-off-white/55">Smakrådgivning</span>
        </span>
      </button>
    </div>
  )
}

function PhoneIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 4.5c.4-1 1.4-1.5 2.4-1.3l1.2.3c.9.2 1.5 1 1.5 1.9v1.6c0 .8-.5 1.5-1.2 1.8l-1 .4a12.5 12.5 0 0 0 5.4 5.4l.4-1c.3-.7 1-1.2 1.8-1.2h1.6c.9 0 1.7.6 1.9 1.5l.3 1.2c.2 1-.3 2-1.3 2.4A15.5 15.5 0 0 1 4.5 6.8c.4-1 1.4-1.5 2.4-1.3l1.6.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
