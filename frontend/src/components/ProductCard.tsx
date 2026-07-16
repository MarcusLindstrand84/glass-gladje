import { Link } from 'react-router-dom'
import { ProductImage } from './ProductImage'
import type { ProductListItem } from '../lib/api'

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      to={`/butik/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-charcoal/[0.06] bg-white overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(28,25,23,0.18)] hover:border-charcoal/10"
    >
      <div className="aspect-[5/4] relative bg-creamy-beige overflow-hidden">
        <ProductImage
          src={product.baseImageUrl}
          alt={product.nameSv}
          className="h-full w-full transition duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {product.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {product.dietaryTags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-[0.12em] rounded-full bg-creamy-beige px-2.5 py-0.5 text-charcoal/50"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <h3 className="font-display text-lg sm:text-xl font-medium text-charcoal transition group-hover:text-soft-brown">
          {product.nameSv}
        </h3>
        <p className="mt-1.5 text-sm text-charcoal/50 line-clamp-2 flex-1 leading-relaxed">
          {product.shortDescriptionSv}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-charcoal/[0.05] pt-3.5">
          <p className="font-semibold text-charcoal tracking-tight">
            från {product.fromPriceSekInclVat.toFixed(0)} kr
            <span className="ml-1 text-xs font-normal text-charcoal/40">inkl. moms</span>
          </p>
          <span
            className={`text-[11px] tracking-wide ${product.inStock ? 'text-soft-brown' : 'text-charcoal/40'}`}
          >
            {product.inStock ? 'I lager' : 'Slut'}
          </span>
        </div>
      </div>
    </Link>
  )
}
