import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../lib/auth'
import api, { type PagedResult, type ProductDetail, type ProductListItem } from '../lib/api'
import { TwoFactorSetup } from '../components/TwoFactorSetup'

export function AdminPage() {
  const { user, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<PagedResult<ProductListItem>>('/products', {
        params: { pageSize: 50 },
      })
      return data
    },
  })

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<
        { id: string; orderNumber: string; status: string; totalInclVat: number; customerName: string }[]
      >('/orders')
      return data
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/orders/${id}/status`, { status })
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = `test-smak-${Date.now()}`
      const { data } = await api.post<ProductDetail>('/products', {
        nameSv: 'Testsmak Admin',
        slug,
        descriptionSv: 'En testsats skapad från adminpanelen.',
        shortDescriptionSv: 'Admin-skapad testsats.',
        baseImageUrl: null,
        sortOrder: 99,
        isActive: true,
        dietaryTags: ['Glutenfri'],
        variants: [
          {
            flavorNameSv: 'Testsmak Admin',
            size: '500ml',
            format: 'Burk',
            sku: `GG-TEST-${Date.now()}`,
            priceSekInclVat: 99,
            vatRate: 0.12,
            stockQty: 10,
            allergens: [],
            ingredientsSv: 'Grädde, socker, vanilj.',
            imageUrl: null,
            isActive: true,
          },
        ],
      })
      return data
    },
    onSuccess: (p) => {
      setMessage(`Skapade produkt: ${p.nameSv}`)
      void qc.invalidateQueries({ queryKey: ['admin-products'] })
      void qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => setMessage('Kunde inte skapa produkt.'),
  })

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Logga in som admin för att fortsätta.</p>
        <Link to="/logga-in" className="mt-4 inline-block text-soft-brown underline">
          Logga in
        </Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Du har inte behörighet till adminpanelen.</p>
      </div>
    )
  }

  function onCreate(e: FormEvent) {
    e.preventDefault()
    createMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Admin</h1>
          <p className="mt-2 text-charcoal/70">Produkter, ordrar, lager och bokföring.</p>
        </div>
        <Link
          to="/admin/bokforing"
          className="rounded-full bg-peach px-5 py-2.5 font-semibold text-sm hover:brightness-95"
        >
          Min Bokföring →
        </Link>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-creamy-beige/70 p-5 border border-peach/20">
          <p className="text-sm text-charcoal/60">Produkter</p>
          <p className="text-3xl font-display mt-1">{data?.totalCount ?? '–'}</p>
        </div>
        <div className="rounded-2xl bg-cream-orange/40 p-5 border border-peach/20">
          <p className="text-sm text-charcoal/60">Ordrar</p>
          <p className="text-3xl font-display mt-1">{orders?.length ?? '–'}</p>
        </div>
        <Link
          to="/admin/bokforing"
          className="rounded-2xl bg-peach/40 p-5 border border-peach/20 hover:brightness-95 transition"
        >
          <p className="text-sm text-charcoal/60">Min Bokföring</p>
          <p className="text-3xl font-display mt-1">Öppna</p>
        </Link>
      </div>

      <div className="mt-10">
        <TwoFactorSetup />
      </div>

      <form onSubmit={onCreate} className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-full bg-peach px-5 py-2.5 font-semibold hover:brightness-95 disabled:opacity-60"
        >
          {createMutation.isPending ? 'Skapar…' : 'Skapa testprodukt'}
        </button>
        {message && <span className="text-sm text-charcoal/70">{message}</span>}
      </form>

      <h2 className="mt-10 text-2xl">Senaste ordrar</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-peach/25 bg-white mb-10">
        <table className="w-full text-sm text-left">
          <thead className="bg-creamy-beige/50">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Kund</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Totalt</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).slice(0, 10).map((o) => (
              <tr key={o.id} className="border-t border-peach/15">
                <td className="px-4 py-3">
                  <Link to={`/order/${o.id}`} className="text-soft-brown hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) =>
                      statusMutation.mutate({ id: o.id, status: e.target.value })
                    }
                    className="rounded-lg border border-peach/40 px-2 py-1 text-xs bg-white"
                  >
                    {['PendingPayment', 'Paid', 'Processing', 'Shipped', 'Completed', 'Cancelled', 'Refunded'].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                  </select>
                </td>
                <td className="px-4 py-3">{o.totalInclVat.toFixed(0)} kr</td>
              </tr>
            ))}
            {!orders?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-charcoal/50">
                  Inga ordrar ännu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-2xl">Produktkatalog</h2>
      {isLoading && <p className="mt-4 text-charcoal/60">Laddar…</p>}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-peach/25 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-creamy-beige/50">
            <tr>
              <th className="px-4 py-3 font-medium">Namn</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Pris från</th>
              <th className="px-4 py-3 font-medium">Lager</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((p) => (
              <tr key={p.id} className="border-t border-peach/15">
                <td className="px-4 py-3">
                  <Link to={`/butik/${p.slug}`} className="text-soft-brown hover:underline">
                    {p.nameSv}
                  </Link>
                </td>
                <td className="px-4 py-3 text-charcoal/60">{p.slug}</td>
                <td className="px-4 py-3">{p.fromPriceSekInclVat.toFixed(0)} kr</td>
                <td className="px-4 py-3">{p.inStock ? 'Ja' : 'Nej'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
