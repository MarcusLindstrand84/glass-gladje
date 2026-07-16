import type { ReactNode } from 'react'

/** Shared horizontal padding + max width for the whole site. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
  )
}

/** Standard vertical page padding for inner pages (shop, cart, etc.). */
export function Page({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-off-white ${className}`}>
      <Container className="py-12 sm:py-16">{children}</Container>
    </div>
  )
}

/** Page title block: eyebrow + h1 + optional description + optional action. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-10 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-2.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-charcoal font-medium">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-charcoal/55 text-base leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Full-width band with consistent vertical rhythm. */
export function Section({
  children,
  className = '',
  id,
  muted = false,
}: {
  children: ReactNode
  className?: string
  id?: string
  muted?: boolean
}) {
  return (
    <section
      id={id}
      className={`py-16 sm:py-24 ${muted ? 'bg-creamy-beige/50 border-y border-charcoal/[0.04]' : ''} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
      <div className="max-w-xl">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-2.5">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-charcoal font-medium">
          {title}
        </h2>
        {description && (
          <p className="mt-2.5 text-charcoal/50 text-sm sm:text-base leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
