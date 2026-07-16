import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../lib/auth'

type Dashboard = {
  revenueToday: number
  revenueThisMonth: number
  expensesThisMonth: number
  netThisMonth: number
  vatToReportThisMonth: number
  openOrders: number
  lowStockVariants: number
  totalProducts: number
}

type Tx = {
  id: string
  type: string
  category: string
  amountInclVat: number
  vatAmount: number
  vatRate: number
  transactionDate: string
  linkedOrderId?: string | null
  description: string
}

type Summary = {
  from: string
  to: string
  totalIncomeInclVat: number
  totalExpenseInclVat: number
  netResultInclVat: number
  incomeVat: number
  expenseVat: number
  vatToReport: number
  transactionCount: number
  incomeByCategory: { category: string; amountInclVat: number; count: number }[]
  expenseByCategory: { category: string; amountInclVat: number; count: number }[]
}

const categoryOptions = [
  { value: 'ForsaljningGlass', label: 'Försäljning glass' },
  { value: 'Ravaror', label: 'Råvaror' },
  { value: 'Forpackning', label: 'Förpackning' },
  { value: 'Frakt', label: 'Frakt' },
  { value: 'Marknadsforing', label: 'Marknadsföring' },
  { value: 'Utrustning', label: 'Utrustning' },
  { value: 'Ovrigt', label: 'Övrigt' },
]

function labelCategory(c: string) {
  return categoryOptions.find((x) => x.value === c)?.label ?? c
}

function labelType(t: string) {
  return t === 'Income' ? 'Intäkt' : t === 'Expense' ? 'Kostnad' : t
}

export function AccountingPage() {
  const { isAdmin, user } = useAuth()
  const qc = useQueryClient()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const monthStart = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }, [])

  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [type, setType] = useState('Expense')
  const [category, setCategory] = useState('Ravaror')
  const [amount, setAmount] = useState('')
  const [vatRate, setVatRate] = useState('0.25')
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { data: dashboard } = useQuery({
    queryKey: ['accounting-dashboard'],
    enabled: isAdmin,
    queryFn: async () => (await api.get<Dashboard>('/accounting/dashboard')).data,
  })

  const { data: summary } = useQuery({
    queryKey: ['accounting-summary', from, to],
    enabled: isAdmin,
    queryFn: async () =>
      (await api.get<Summary>('/accounting/summary', { params: { from, to } })).data,
  })

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['accounting-tx', from, to],
    enabled: isAdmin,
    queryFn: async () =>
      (await api.get<Tx[]>('/accounting/transactions', { params: { from, to } })).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/accounting/transactions', {
        type,
        category,
        amountInclVat: Number(amount.replace(',', '.')),
        vatRate: Number(vatRate.replace(',', '.')),
        transactionDate: date,
        description,
      })
    },
    onSuccess: () => {
      setAmount('')
      setDescription('')
      setFormError(null)
      void qc.invalidateQueries({ queryKey: ['accounting-tx'] })
      void qc.invalidateQueries({ queryKey: ['accounting-summary'] })
      void qc.invalidateQueries({ queryKey: ['accounting-dashboard'] })
    },
    onError: () => setFormError('Kunde inte spara posten. Kontrollera fälten.'),
  })

  async function onExport() {
    const res = await api.get('/accounting/export', {
      params: { from, to },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(res.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glassgladje-bokforing-${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Logga in som admin.</p>
        <Link to="/logga-in" className="text-soft-brown underline mt-4 inline-block">
          Logga in
        </Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Min Bokföring är endast för administratörer.</p>
      </div>
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    createMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Min Bokföring</h1>
          <p className="mt-2 text-sm text-charcoal/70 max-w-2xl">
            Förenklad översikt – ersätter inte fullständig bokföring/redovisningsbyrå vid behov.
            Ordrar bokförs automatiskt när de betalas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onExport()}
          className="rounded-full bg-cream-orange px-5 py-2.5 font-semibold text-sm hover:brightness-95"
        >
          Exportera till Excel (CSV)
        </button>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Intäkter idag" value={`${(dashboard?.revenueToday ?? 0).toFixed(0)} kr`} />
        <Kpi label="Intäkter denna månad" value={`${(dashboard?.revenueThisMonth ?? 0).toFixed(0)} kr`} />
        <Kpi label="Kostnader denna månad" value={`${(dashboard?.expensesThisMonth ?? 0).toFixed(0)} kr`} />
        <Kpi
          label="Moms att redovisa (månad)"
          value={`${(dashboard?.vatToReportThisMonth ?? 0).toFixed(0)} kr`}
          hint="Utgående − ingående (förenklat)"
        />
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <Kpi label="Resultat månad" value={`${(dashboard?.netThisMonth ?? 0).toFixed(0)} kr`} />
        <Kpi label="Öppna ordrar" value={`${dashboard?.openOrders ?? 0}`} />
        <Kpi label="Lågt lager (≤5)" value={`${dashboard?.lowStockVariants ?? 0}`} />
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-8">
        <section className="rounded-2xl border border-peach/25 bg-white p-6">
          <h2 className="text-xl font-display">Periodöversikt</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <label>
              Från
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="ml-2 rounded-lg border border-peach/40 px-2 py-1"
              />
            </label>
            <label>
              Till
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="ml-2 rounded-lg border border-peach/40 px-2 py-1"
              />
            </label>
          </div>
          {summary && (
            <dl className="mt-6 space-y-2 text-sm">
              <Row k="Intäkter inkl. moms" v={`${summary.totalIncomeInclVat.toFixed(2)} kr`} />
              <Row k="Kostnader inkl. moms" v={`${summary.totalExpenseInclVat.toFixed(2)} kr`} />
              <Row k="Resultat" v={`${summary.netResultInclVat.toFixed(2)} kr`} bold />
              <Row k="Utgående moms" v={`${summary.incomeVat.toFixed(2)} kr`} />
              <Row k="Ingående moms" v={`${summary.expenseVat.toFixed(2)} kr`} />
              <Row k="Moms att redovisa" v={`${summary.vatToReport.toFixed(2)} kr`} bold />
              <Row k="Antal poster" v={`${summary.transactionCount}`} />
            </dl>
          )}
        </section>

        <section className="rounded-2xl border border-peach/25 bg-white p-6">
          <h2 className="text-xl font-display">Manuell post</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <label>
                Typ
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-peach/40 px-3 py-2"
                >
                  <option value="Income">Intäkt</option>
                  <option value="Expense">Kostnad</option>
                </select>
              </label>
              <label>
                Kategori
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-peach/40 px-3 py-2"
                >
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label>
                Belopp inkl. moms (kr)
                <input
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-peach/40 px-3 py-2"
                  inputMode="decimal"
                />
              </label>
              <label>
                Momssats (t.ex. 0.12 / 0.25)
                <input
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-peach/40 px-3 py-2"
                />
              </label>
            </div>
            <label className="block">
              Datum
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-peach/40 px-3 py-2"
              />
            </label>
            <label className="block">
              Beskrivning
              <input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-peach/40 px-3 py-2"
                placeholder="T.ex. Inköp grädde batch 12"
              />
            </label>
            {formError && <p className="text-red-700">{formError}</p>}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-full bg-peach px-6 py-2.5 font-semibold hover:brightness-95 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Sparar…' : 'Spara post'}
            </button>
          </form>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-display">Transaktioner</h2>
        {isLoading && <p className="mt-3 text-charcoal/60">Laddar…</p>}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-peach/25 bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-creamy-beige/50">
              <tr>
                <th className="px-3 py-3">Datum</th>
                <th className="px-3 py-3">Typ</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3">Beskrivning</th>
                <th className="px-3 py-3 text-right">Belopp</th>
                <th className="px-3 py-3 text-right">Moms</th>
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((t) => (
                <tr key={t.id} className="border-t border-peach/15">
                  <td className="px-3 py-2 whitespace-nowrap">{t.transactionDate}</td>
                  <td className="px-3 py-2">{labelType(t.type)}</td>
                  <td className="px-3 py-2">{labelCategory(t.category)}</td>
                  <td className="px-3 py-2">
                    {t.description}
                    {t.linkedOrderId && (
                      <span className="ml-1 text-xs text-charcoal/40">(auto order)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {t.type === 'Expense' ? '−' : ''}
                    {t.amountInclVat.toFixed(2)} kr
                  </td>
                  <td className="px-3 py-2 text-right text-charcoal/60">{t.vatAmount.toFixed(2)}</td>
                </tr>
              ))}
              {!transactions?.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-charcoal/50">
                    Inga poster i perioden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-peach/20 bg-gradient-to-br from-creamy-beige/80 to-cream-orange/30 p-5">
      <p className="text-xs uppercase tracking-wide text-charcoal/60">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-charcoal/50">{hint}</p>}
    </div>
  )
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? 'font-semibold pt-2 border-t border-peach/20' : ''}`}>
      <dt className="text-charcoal/70">{k}</dt>
      <dd>{v}</dd>
    </div>
  )
}
