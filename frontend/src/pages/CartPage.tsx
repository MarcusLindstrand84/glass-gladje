import { Link } from 'react-router-dom'
import { useCart } from '../lib/cart'
import { Page, PageHeader } from '../components/ui/PageShell'
import { ButtonLink } from '../components/ui/Button'

export function CartPage() {
  const { lines, totalInclVat, setQuantity, removeItem, itemCount } = useCart()

  if (itemCount === 0) {
    return (
      <Page>
        <div className="max-w-md mx-auto text-center py-8">
          <PageHeader title="Din korg" description="Din korg väntar på sin första sked glädje." />
          <ButtonLink to="/butik" variant="primary">
            Upptäck smakerna
          </ButtonLink>
        </div>
      </Page>
    )
  }

  return (
    <Page>
      <div className="max-w-3xl">
        <PageHeader
          eyebrow="Varukorg"
          title="Din korg"
          description={`${itemCount} ${itemCount === 1 ? 'vara' : 'varor'} i korgen.`}
        />

        <ul className="space-y-3">
          {lines.map((line) => (
            <li
              key={line.productVariantId}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-charcoal/8 bg-white p-4"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/butik/${line.slug}`}
                  className="font-display text-lg text-charcoal hover:text-soft-brown"
                >
                  {line.productName}
                </Link>
                <p className="text-sm text-charcoal/55">{line.variantLabel}</p>
                <p className="mt-1 text-sm font-medium">{line.unitPriceInclVat.toFixed(0)} kr / st</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-charcoal/70">
                  Antal
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => setQuantity(line.productVariantId, Number(e.target.value))}
                    className="ml-2 w-16 rounded-lg border border-charcoal/15 px-2 py-1.5"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(line.productVariantId)}
                  className="text-sm text-charcoal/50 hover:text-charcoal underline"
                >
                  Ta bort
                </button>
              </div>
              <p className="font-semibold sm:w-24 sm:text-right tabular-nums">
                {(line.unitPriceInclVat * line.quantity).toFixed(0)} kr
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-charcoal/10 pt-6">
          <p className="text-lg">
            Totalt:{' '}
            <span className="font-display text-2xl">{totalInclVat.toFixed(0)} kr</span>
            <span className="text-sm text-charcoal/45 ml-1">inkl. moms</span>
          </p>
          <ButtonLink to="/kassa" variant="dark">
            Till kassan
          </ButtonLink>
        </div>
      </div>
    </Page>
  )
}
