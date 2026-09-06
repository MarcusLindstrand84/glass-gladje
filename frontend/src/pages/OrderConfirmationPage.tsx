import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

type OrderDto = {
  id: string
  orderNumber: string
  status: string
  customerName: string
  email: string
  totalInclVat: number
  vatAmount: number
  subtotalExclVat: number
  currency: string
  createdAt: string
  items: {
    productName: string
    variantLabel: string
    quantity: number
    unitPriceInclVat: number
    lineTotalInclVat: number
  }[]
}

export function OrderConfirmationPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const confirmed = params.get('bekraftad') === '1'
  const pendingPayment = params.get('pending') === '1'
  const accessToken = params.get('accessToken')

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id, accessToken],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<OrderDto>(`/orders/${id}`, {
        params: { accessToken },
      })
      return data
    },
  })

  if (isLoading) {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-charcoal/60">Laddar order…</p>
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p>Ordern hittades inte.</p>
        <Link to="/butik" className="text-soft-brown underline">
          Till butiken
        </Link>
      </div>
    )
  }

  const paid =
    order.status === 'Paid' ||
    order.status === 'Processing' ||
    order.status === 'Shipped' ||
    order.status === 'Completed' ||
    confirmed

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-3xl border border-peach/30 bg-gradient-to-br from-creamy-beige to-cream-orange/30 p-8">
        <p className="text-sm uppercase tracking-widest text-soft-brown">
          {paid ? 'Tack för din beställning' : pendingPayment ? 'Väntar på betalning' : 'Order mottagen'}
        </p>
        <h1 className="mt-2 text-3xl">Order {order.orderNumber}</h1>
        <p className="mt-3 text-charcoal/80">
          {paid ? (
            <>
              Hej {order.customerName} – vilken glädje att du valde oss! Vi förbereder din order med
              samma omsorg som vi lägger i varje glassats.
            </>
          ) : (
            <>
              Hej {order.customerName}. Din order är skapad och väntar på slutförd betalning
              (status: {order.status}). När betalningen bekräftas skickar vi en orderbekräftelse.
            </>
          )}
        </p>
        <p className="mt-2 text-sm text-charcoal/60">
          Status: <strong>{order.status}</strong>
          {order.email ? ` · ${order.email}` : null}
        </p>
      </div>

      <ul className="mt-8 space-y-3">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between gap-4 rounded-xl bg-white border border-peach/20 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-charcoal/60">
                {item.variantLabel} × {item.quantity}
              </p>
            </div>
            <p className="font-medium">{item.lineTotalInclVat.toFixed(0)} kr</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-right space-y-1 text-sm">
        <p className="text-charcoal/60">Exkl. moms: {order.subtotalExclVat.toFixed(2)} kr</p>
        <p className="text-charcoal/60">Moms: {order.vatAmount.toFixed(2)} kr</p>
        <p className="text-xl font-display">
          Totalt: {order.totalInclVat.toFixed(0)} kr
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/butik" className="rounded-full bg-peach px-6 py-3 font-semibold">
          Fortsätt handla
        </Link>
        <Link to="/konto" className="rounded-full bg-cream-orange px-6 py-3 font-semibold">
          Mina ordrar
        </Link>
      </div>
    </div>
  )
}
