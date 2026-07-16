import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { type PagedResult, type ProductListItem } from '../lib/api'
import { ProductCard } from '../components/ProductCard'
import { Page, PageHeader } from '../components/ui/PageShell'

const dietaryOptions = [
  { value: '', label: 'Alla' },
  { value: 'Vegan', label: 'Vegansk' },
  { value: 'Laktosfri', label: 'Laktosfri' },
  { value: 'Glutenfri', label: 'Glutenfri' },
  { value: 'Notter', label: 'Innehåller nötter' },
]

export function ShopPage() {
  const [search, setSearch] = useState('')
  const [dietaryTag, setDietaryTag] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  const params = useMemo(
    () => ({
      search: search || undefined,
      dietaryTag: dietaryTag || undefined,
      inStockOnly: inStockOnly || undefined,
      pageSize: 24,
    }),
    [search, dietaryTag, inStockOnly],
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get<PagedResult<ProductListItem>>('/products', { params })
      return data
    },
  })

  return (
    <Page>
      <PageHeader
        eyebrow="Shoppa"
        title="Butik"
        description="Upptäck våra smaker – filtrera efter preferens och hitta din nästa favorit."
      />

      <div className="rounded-2xl border border-charcoal/8 bg-white p-4 sm:p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="flex-1 text-sm">
            <span className="font-medium text-charcoal/80">Sök</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="T.ex. jordgubb, vegansk…"
              className="mt-1.5 w-full rounded-xl border border-charcoal/10 bg-off-white px-3 py-2.5 focus:border-peach focus:outline-none"
            />
          </label>
          <label className="text-sm sm:w-48">
            <span className="font-medium text-charcoal/80">Kost</span>
            <select
              value={dietaryTag}
              onChange={(e) => setDietaryTag(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-charcoal/10 bg-off-white px-3 py-2.5"
            >
              {dietaryOptions.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm pb-2.5 sm:pb-3">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-peach"
            />
            Endast i lager
          </label>
        </div>
      </div>

      {isLoading && <p className="text-charcoal/50">Laddar sortiment…</p>}
      {isError && (
        <p className="text-red-700">
          Något gick snett. Försök igen – vi vill inte att glädjen ska vänta.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {(data?.items ?? []).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {data && data.items.length === 0 && (
        <p className="mt-8 text-charcoal/60">Inga produkter matchade din sökning.</p>
      )}
    </Page>
  )
}
