import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth'
import api from '../lib/api'
import { Page, PageHeader } from '../components/ui/PageShell'
import { ButtonLink } from '../components/ui/Button'

type OrderDto = {
  id: string
  orderNumber: string
  status: string
  totalInclVat: number
  createdAt: string
}

export function AccountPage() {
  const { user, isAdmin } = useAuth()

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await api.get<OrderDto[]>('/orders/mine')
      return data
    },
  })

  if (!user) {
    return (
      <Page>
        <div className="max-w-md mx-auto text-center py-8">
          <PageHeader
            title="Konto"
            description="Du behöver logga in för att se ditt konto."
          />
          <ButtonLink to="/logga-in" variant="dark">
            Logga in
          </ButtonLink>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <div className="max-w-2xl">
        <PageHeader
          eyebrow="Mitt konto"
          title={`Hej, ${user.fullName}`}
          description={user.email}
        />

        <div className="rounded-2xl border border-charcoal/8 bg-white p-6 space-y-2 mb-10">
          <p className="text-sm">
            <span className="font-medium">Roller:</span> {user.roles.join(', ')}
          </p>
          {isAdmin && (
            <Link to="/admin" className="inline-block text-sm font-semibold text-soft-brown underline">
              Gå till adminpanelen →
            </Link>
          )}
        </div>

        <h2 className="font-display text-2xl text-charcoal mb-4">Orderhistorik</h2>
        {!orders?.length ? (
          <p className="text-sm text-charcoal/55">Du har inga ordrar ännu.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/order/${o.id}`}
                  className="flex justify-between rounded-xl border border-charcoal/8 bg-white px-4 py-3 hover:border-peach/40 transition"
                >
                  <span>
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="text-sm text-charcoal/45 ml-2">{o.status}</span>
                  </span>
                  <span className="font-medium tabular-nums">{o.totalInclVat.toFixed(0)} kr</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  )
}
