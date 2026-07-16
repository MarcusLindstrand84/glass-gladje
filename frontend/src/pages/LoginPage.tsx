import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, type TwoFactorPending } from '../lib/auth'
import { Page, PageHeader } from '../components/ui/PageShell'
import { Button } from '../components/ui/Button'

function redirectAfterLogin(navigate: ReturnType<typeof useNavigate>) {
  try {
    const raw = localStorage.getItem('gg_user')
    const u = raw ? (JSON.parse(raw) as { roles?: string[] }) : null
    navigate(u?.roles?.includes('Admin') ? '/admin' : '/konto')
  } catch {
    navigate('/konto')
  }
}

export function LoginPage() {
  const { login, completeTwoFactorLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pending2fa, setPending2fa] = useState<TwoFactorPending | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const pending = await login(email, password)
      if (pending) {
        setPending2fa(pending)
        return
      }
      redirectAfterLogin(navigate)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Fel e-post eller lösenord.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function onTwoFactorSubmit(e: FormEvent) {
    e.preventDefault()
    if (!pending2fa) return
    setError(null)
    setLoading(true)
    try {
      await completeTwoFactorLogin(pending2fa, code)
      redirectAfterLogin(navigate)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Felaktig engångskod.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page>
      <div className="max-w-md mx-auto">
        <PageHeader
          title={pending2fa ? 'Bekräfta med 2FA' : 'Logga in'}
          description={
            pending2fa
              ? 'Du har tvåfaktorsautentisering påslaget. Ange koden från din app (eller en återställningskod).'
              : 'Logga in med e-post och lösenord – som vanligt.'
          }
        />

        {!pending2fa ? (
          <form
            onSubmit={onPasswordSubmit}
            className="space-y-4 rounded-2xl border border-charcoal/8 bg-white p-6"
          >
            <p className="text-xs text-charcoal/45 tracking-wide">
              E-post + lösenord. 2FA används bara om du aktiverat det under Admin.
            </p>
            <label className="block text-sm">
              <span className="font-medium">E-post</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
                autoComplete="email"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Lösenord</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white"
                autoComplete="current-password"
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit" variant="dark" disabled={loading} className="w-full">
              {loading ? 'Loggar in…' : 'Logga in med lösenord'}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={onTwoFactorSubmit}
            className="space-y-4 rounded-2xl border border-charcoal/8 bg-white p-6"
          >
            <label className="block text-sm">
              <span className="font-medium">Engångskod</span>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-charcoal/10 px-3 py-2.5 bg-off-white tracking-widest text-center text-lg"
                placeholder="000000"
                autoFocus
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Button type="submit" variant="dark" disabled={loading || code.length < 6} className="w-full">
              {loading ? 'Verifierar…' : 'Verifiera'}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-charcoal/50 hover:text-charcoal"
              onClick={() => {
                setPending2fa(null)
                setCode('')
                setError(null)
              }}
            >
              ← Tillbaka
            </button>
          </form>
        )}

        {!pending2fa && (
          <p className="mt-6 text-sm text-charcoal/60 text-center">
            Inget konto?{' '}
            <Link to="/skapa-konto" className="font-semibold text-soft-brown underline">
              Skapa konto
            </Link>
          </p>
        )}
      </div>
    </Page>
  )
}
