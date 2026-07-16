import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Page, PageHeader } from '../components/ui/PageShell'
import { Button } from '../components/ui/Button'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ email, password, fullName, marketingConsent })
      navigate('/konto')
    } catch {
      setError('Kunde inte skapa konto. Kontrollera uppgifterna och försök igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page>
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Skapa konto"
          description="Ett konto ger dig orderhistorik och snabbare kassa."
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
            <span className="font-medium">Lösenord (minst 8 tecken)</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
            />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1"
            />
            <span>Ja, jag vill få nyheter och erbjudanden från Glassglädje (valfritt).</span>
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Skapar konto…' : 'Skapa konto'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-charcoal/60 text-center">
          Har du redan konto?{' '}
          <Link to="/logga-in" className="font-semibold text-soft-brown underline">
            Logga in
          </Link>
        </p>
      </div>
    </Page>
  )
}
