import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api, { type ProductDetail } from '../lib/api'
import { useCart } from '../lib/cart'
import { ProductImage } from '../components/ProductImage'
import { Page } from '../components/ui/PageShell'
import { Button, ButtonLink } from '../components/ui/Button'

export function ProductPage() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const [variantId, setVariantId] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<ProductDetail>(`/products/${slug}`)
      return data
    },
  })

  const selected =
    product?.variants.find((v) => v.id === variantId) ?? product?.variants[0] ?? null

  if (isLoading) {
    return (
      <Page>
        <p className="text-charcoal/50">Laddar produkt…</p>
      </Page>
    )
  }

  if (isError || !product) {
    return (
      <Page>
        <p className="text-charcoal/70">Produkten hittades inte.</p>
        <Link to="/butik" className="mt-4 inline-block text-sm font-semibold text-soft-brown underline">
          Tillbaka till butiken
        </Link>
      </Page>
    )
  }

  return (
    <Page>
      <nav className="mb-6 text-sm text-charcoal/50">
        <Link to="/butik" className="hover:text-charcoal">
          Butik
        </Link>
        <span className="mx-2">/</span>
        <span className="text-charcoal">{product.nameSv}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="aspect-square rounded-2xl overflow-hidden relative bg-creamy-beige ring-1 ring-charcoal/5">
          <ProductImage
            src={selected?.imageUrl || product.baseImageUrl}
            alt={product.nameSv}
            className="h-full w-full"
            fallbackEmoji="🍨"
          />
        </div>

        <div>
          {product.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {product.dietaryTags.map((t) => (
                <span
                  key={t}
                  className="text-xs rounded-full bg-creamy-beige px-3 py-1 text-charcoal/70"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-charcoal">
            {product.nameSv}
          </h1>
          <p className="mt-4 text-charcoal/70 leading-relaxed">{product.descriptionSv}</p>

          <div className="mt-8">
            <p className="text-sm font-medium text-charcoal">Storlek</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selected?.id === v.id
                      ? 'border-peach bg-peach font-semibold'
                      : 'border-charcoal/15 bg-white hover:border-peach/50'
                  }`}
                >
                  {v.size} · {v.priceSekInclVat.toFixed(0)} kr
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="mt-6 space-y-2">
              <p className="font-display text-3xl text-charcoal">
                {selected.priceSekInclVat.toFixed(0)} kr{' '}
                <span className="text-sm font-sans font-normal text-charcoal/45">inkl. moms</span>
              </p>
              <p className="text-sm text-charcoal/55">
                {selected.stockQty > 0
                  ? `${selected.stockQty} st i lager`
                  : 'Slut för tillfället – fråga oss gärna om nästa batch'}
              </p>
              <p className="text-sm text-charcoal/70 pt-2">
                <span className="font-medium text-charcoal">Innehåll:</span> {selected.ingredientsSv}
              </p>
              {selected.allergens.length > 0 && (
                <p className="text-sm text-soft-brown">
                  Allergener: {selected.allergens.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              disabled={!selected || selected.stockQty <= 0}
              onClick={() => {
                if (!selected) return
                addItem({
                  productVariantId: selected.id,
                  productName: product.nameSv,
                  variantLabel: `${selected.size} · ${selected.format}`,
                  unitPriceInclVat: selected.priceSekInclVat,
                  slug: product.slug,
                })
                setAdded(true)
                setTimeout(() => setAdded(false), 2500)
              }}
            >
              {added ? 'Tillagd i korgen' : 'Lägg i korgen'}
            </Button>
            <ButtonLink to="/conversational-ai" variant="secondary">
              Fråga smakrådgivaren
            </ButtonLink>
          </div>
        </div>
      </div>
    </Page>
  )
}
