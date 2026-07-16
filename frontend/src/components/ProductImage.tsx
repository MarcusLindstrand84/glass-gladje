type Props = {
  src?: string | null
  alt: string
  className?: string
  fallbackEmoji?: string
}

/** Resolves product image URLs from API (absolute or site-relative under /images). */
export function ProductImage({
  src,
  alt,
  className = '',
  fallbackEmoji = '🍦',
}: Props) {
  const url = resolveImageUrl(src)

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-creamy-beige to-peach/40 text-4xl ${className}`}
        aria-hidden
      >
        {fallbackEmoji}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={(e) => {
        const el = e.currentTarget
        el.style.display = 'none'
        const parent = el.parentElement
        if (parent && !parent.querySelector('[data-fallback]')) {
          const fb = document.createElement('div')
          fb.dataset.fallback = '1'
          fb.className =
            'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-creamy-beige to-peach/40 text-4xl'
          fb.textContent = fallbackEmoji
          parent.classList.add('relative')
          parent.appendChild(fb)
        }
      }}
    />
  )
}

export function resolveImageUrl(src?: string | null): string | null {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src
  }
  // Seed paths like /images/products/slug.jpg → served from Vite public/
  return src.startsWith('/') ? src : `/${src}`
}
