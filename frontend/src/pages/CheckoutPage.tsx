import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { Page, PageHeader } from '../components/ui/PageShell'
import { Button, ButtonLink } from '../components/ui/Button'

type CreateOrderResponse = {
  orderId: string
  orderNumber: string
  totalInclVat: number
  currency: string
  clientSecret?: string | null
  publishableKey?: string | null
  devMockPayment: boolean
}

export function CheckoutPage() {
  const { lines, totalInclVat, clear, itemCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email ?? '')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [street, setStreet] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (itemCount === 0) {
    return (
      <Page>
        <div className="max-w-md mx-auto text-center py-8">
          <p className="text-charcoal/70">Korgen är tom.</p>
          <ButtonLink to="/butik" variant="primary" className="mt-6">
            Till butiken
          </ButtonLink>
        </div>
      </Page>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<CreateOrderResponse>('/orders', {
        items: lines.map((l) => ({
          productVariantId: l.productVariantId,
          quantity: l.quantity,
        })),
        email,
        customerName: fullName,
        shippingAddress: {
          fullName,
          street,
          postalCode,
          city,
          country: 'SE',
          phone: phone || null,
        },
      })

      if (data.devMockPayment) {
        await api.post('/orders/dev-confirm-payment', { orderId: data.orderId })
        clear()
        navigate(`/order/${data.orderId}?bekraftad=1`)
        return
      }

      clear()
      navigate(`/order/${data.orderId}?pending=1`)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Något gick snett. Försök igen – vi vill inte att glädjen ska vänta.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page>
      <div className="max-w-xl">
        <PageHeader
          eyebrow="Checkout"
          title="Kassa"
          description={`Totalt att betala: ${totalInclVat.toFixed(0)} kr inkl. moms`}
        />

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-charcoal/8 bg-white p-6">
          <label className="block text-sm">
            <span className="font-medium">Namn</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">E-post</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Telefon</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Gatuadress</span>
            <input
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium">Postnummer</span>
              <input
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Ort</span>
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
              />
            </label>
          </div>

          <div className="rounded-xl bg-creamy-beige/50 border border-peach/20 p-4 text-sm text-charcoal/65">
            Utan Stripe-nycklar simuleras betalning i utvecklingsläge så du kan testa hela flödet.
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" variant="dark" disabled={loading}>
              {loading ? 'Bearbetar…' : 'Betala säkert'}
            </Button>
            <Link to="/korg" className="text-sm self-center text-charcoal/55 hover:text-charcoal underline">
              Tillbaka till korgen
            </Link>
          </div>
        </form>
      </div>
    </Page>
  )
}
