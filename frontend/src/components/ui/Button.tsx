import { Link } from 'react-router-dom'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'outline'

const variants: Record<Variant, string> = {
  primary:
    'bg-peach text-charcoal hover:brightness-[0.97] shadow-[0_1px_2px_rgba(28,25,23,0.06)]',
  secondary:
    'bg-cream-orange/90 text-charcoal hover:brightness-[0.97]',
  dark:
    'bg-charcoal text-off-white hover:bg-charcoal/90 shadow-[0_1px_2px_rgba(28,25,23,0.12)]',
  outline:
    'bg-transparent text-charcoal border border-charcoal/15 hover:border-charcoal/30 hover:bg-charcoal/[0.03]',
  ghost:
    'bg-transparent text-charcoal/70 hover:text-charcoal underline-offset-4 hover:underline px-0 py-0 shadow-none rounded-none border-0',
}

const base =
  'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition duration-200 disabled:opacity-50 disabled:pointer-events-none'

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  children,
}: {
  to: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  )
}
