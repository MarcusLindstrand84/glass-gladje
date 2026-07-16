import { Link } from 'react-router-dom'

/** Brand slogan – agency line for Glassglädje */
export const BRAND_SLOGAN = 'Glädje du kan smaka'

type LogoProps = {
  compact?: boolean
  withSlogan?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Ice cream–forward brand lockup.
 * Mark: gold spoon + peach gelato scoop with melt (Imagine exploration → vector).
 */
export function Logo({ compact = true, withSlogan = false, className = '', onClick }: LogoProps) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 min-w-0 ${className}`}
      aria-label={`Glassglädje – ${BRAND_SLOGAN}`}
    >
      <Mark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
      <span className="min-w-0 flex flex-col leading-none">
        <span className="font-display text-[1.2rem] sm:text-[1.35rem] font-medium tracking-tight text-charcoal group-hover:text-charcoal/85 transition-colors">
          Glassglädje
        </span>
        {(withSlogan || compact) && (
          <span
            className={`mt-1 font-medium text-soft-brown ${
              withSlogan && !compact
                ? 'text-[10px] uppercase tracking-[0.14em]'
                : 'hidden sm:block text-[10px] tracking-wide text-soft-brown/85 normal-case'
            }`}
          >
            {BRAND_SLOGAN}
          </span>
        )}
      </span>
    </Link>
  )
}

/** Spoon + gelato scoop – clearly ice cream, premium, scalable */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="scoopBody" x1="28" y1="14" x2="58" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f3c4b0" />
          <stop offset="0.45" stopColor="#e8a58a" />
          <stop offset="1" stopColor="#d4896e" />
        </linearGradient>
        <linearGradient id="scoopCream" x1="30" y1="36" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff8f0" />
          <stop offset="1" stopColor="#f0d4b4" />
        </linearGradient>
        <linearGradient id="spoonMetal" x1="12" y1="20" x2="70" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8d5a8" />
          <stop offset="0.5" stopColor="#c4a574" />
          <stop offset="1" stopColor="#a68b52" />
        </linearGradient>
        <radialGradient id="scoopShine" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 22) rotate(90) scale(14 16)">
          <stop stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft plate / seal */}
      <circle cx="40" cy="40" r="37" fill="#f5efe6" />
      <circle cx="40" cy="40" r="37" stroke="#c4a574" strokeWidth="1.2" opacity="0.55" />

      {/* Spoon handle (back) */}
      <path
        d="M18 52c8-6 16-14 22-22"
        stroke="url(#spoonMetal)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M16 54.5c1.2 1.8 3.2 2.6 5.2 1.6"
        stroke="url(#spoonMetal)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Spoon bowl */}
      <ellipse
        cx="44"
        cy="42"
        rx="16"
        ry="9"
        transform="rotate(-28 44 42)"
        fill="url(#spoonMetal)"
      />
      <ellipse
        cx="44"
        cy="41"
        rx="12"
        ry="6"
        transform="rotate(-28 44 41)"
        fill="#f7ecd4"
        opacity="0.55"
      />

      {/* Cream melt under scoop */}
      <path
        d="M34 44c2 4 6 7 12 6 4-.5 7-2 9-4-1 5-4 9-10 10-7 1-12-3-13-8 .5-1.5 1.2-3 2-4Z"
        fill="url(#scoopCream)"
      />
      {/* Melt drip */}
      <path
        d="M50 48c.5 3 .2 6-1.2 8.5"
        stroke="#e8a58a"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="48.5" cy="57.5" r="1.6" fill="#e8a58a" opacity="0.9" />

      {/* Main scoop */}
      <ellipse cx="42" cy="30" rx="15.5" ry="14" fill="url(#scoopBody)" />
      {/* Scoop texture / swirl lines */}
      <path
        d="M32 28c3 2 7 3 12 2.5 4-.4 8-2 11-4"
        stroke="#fff8f0"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M31 34c4 2.5 9 3.5 14 2.5 3.5-.7 7-2.5 9.5-4.5"
        stroke="#c47a5e"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* Highlight */}
      <ellipse cx="36" cy="24" rx="5.5" ry="4" fill="url(#scoopShine)" />
      {/* Rim where scoop sits in spoon */}
      <path
        d="M28 38c4 3 10 4.5 16 4 5-.4 9-2 12-4.5"
        stroke="#d4896e"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}

export function LogoLockup({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Mark className="h-12 w-12" />
        <div>
          <p className="font-display text-xl font-medium tracking-tight text-charcoal">Glassglädje</p>
          <p className="mt-1 text-[12px] font-medium tracking-wide text-soft-brown">{BRAND_SLOGAN}</p>
        </div>
      </div>
    </div>
  )
}
