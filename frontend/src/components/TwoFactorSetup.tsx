import { useEffect, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import api from '../lib/api'
import { Button } from './ui/Button'

type TwoFactorStatus = {
  enabled: boolean
  isAdmin: boolean
  recommended: boolean
}

type TwoFactorSetup = {
  sharedKey: string
  authenticatorUri: string
  manualEntryKey: string
}

/**
 * TOTP 2FA setup / disable panel for authenticated users (especially admin).
 */
export function TwoFactorSetup() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function refreshStatus() {
    const { data } = await api.get<TwoFactorStatus>('/auth/2fa')
    setStatus(data)
  }

  useEffect(() => {
    void refreshStatus().catch(() => setError('Kunde inte hämta 2FA-status.'))
  }, [])

  async function startSetup() {
    setError(null)
    setMessage(null)
    setRecoveryCodes(null)
    setLoading(true)
    try {
      const { data } = await api.post<TwoFactorSetup>('/auth/2fa/setup')
      setSetup(data)
      const url = await QRCode.toDataURL(data.authenticatorUri, {
        width: 200,
        margin: 2,
        color: { dark: '#1c1917', light: '#faf8f5' },
      })
      setQrDataUrl(url)
    } catch {
      setError('Kunde inte starta 2FA-setup.')
    } finally {
      setLoading(false)
    }
  }

  async function enable(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post<{ enabled: boolean; recoveryCodes: string[] }>(
        '/auth/2fa/enable',
        { code },
      )
      setRecoveryCodes(data.recoveryCodes)
      setSetup(null)
      setQrDataUrl(null)
      setCode('')
      setMessage('Tvåfaktorsautentisering är nu aktiverad.')
      await refreshStatus()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Felaktig kod. Försök igen.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/2fa/disable', { code })
      setCode('')
      setRecoveryCodes(null)
      setMessage('2FA är avstängd.')
      await refreshStatus()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kunde inte stänga av 2FA.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-charcoal/8 bg-white p-6 text-sm text-charcoal/50">
        Laddar säkerhetsinställningar…
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-charcoal/8 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold mb-2">
        Säkerhet
      </p>
      <h2 className="font-display text-2xl font-medium tracking-tight text-charcoal">
        Tvåfaktorsautentisering (2FA)
      </h2>
      <p className="mt-2 text-sm text-charcoal/55 leading-relaxed max-w-xl">
        Skydda admin-kontot med en engångskod från Authenticator-appen (Google Authenticator, Authy,
        1Password m.fl.).
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            status.enabled
              ? 'bg-green-50 text-green-900 border border-green-200'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          {status.enabled ? 'Aktiverad' : 'Ej aktiverad'}
        </span>
        {status.recommended && !status.enabled && (
          <span className="text-xs text-charcoal/50">Rekommenderas starkt för admin</span>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-4 text-sm text-soft-brown">{message}</p>}

      {recoveryCodes && recoveryCodes.length > 0 && (
        <div className="mt-5 rounded-xl border border-gold/30 bg-creamy-beige/50 p-4">
          <p className="text-sm font-semibold text-charcoal">Spara återställningskoderna</p>
          <p className="mt-1 text-xs text-charcoal/55">
            Visa dem bara en gång. Använd om du tappar bort telefonen.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 font-mono text-sm text-charcoal">
            {recoveryCodes.map((c) => (
              <li key={c} className="rounded-lg bg-white/80 px-2 py-1 border border-charcoal/5">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!status.enabled && !setup && (
        <div className="mt-6">
          <Button type="button" variant="dark" onClick={() => void startSetup()} disabled={loading}>
            {loading ? 'Förbereder…' : 'Aktivera 2FA'}
          </Button>
        </div>
      )}

      {setup && (
        <div className="mt-6 grid sm:grid-cols-[auto_1fr] gap-6 items-start">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR-kod för autentiseringsapp"
              className="rounded-xl border border-charcoal/10 bg-off-white"
              width={200}
              height={200}
            />
          )}
          <div>
            <p className="text-sm text-charcoal/70 leading-relaxed">
              1. Öppna autentiseringsappen och skanna QR-koden
              <br />
              2. Eller skriv in nyckeln manuellt:
            </p>
            <p className="mt-2 font-mono text-sm tracking-wider bg-off-white border border-charcoal/10 rounded-lg px-3 py-2 break-all">
              {setup.manualEntryKey}
            </p>
            <form onSubmit={enable} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-siffrig kod"
                className="rounded-full border border-charcoal/10 bg-off-white px-4 py-2.5 text-sm flex-1"
                required
              />
              <Button type="submit" variant="primary" disabled={loading || code.length < 6}>
                Bekräfta
              </Button>
            </form>
          </div>
        </div>
      )}

      {status.enabled && (
        <form onSubmit={disable} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Kod eller återställningskod"
            className="rounded-full border border-charcoal/10 bg-off-white px-4 py-2.5 text-sm flex-1"
            required
          />
          <Button type="submit" variant="outline" disabled={loading}>
            Stäng av 2FA
          </Button>
        </form>
      )}
    </section>
  )
}
