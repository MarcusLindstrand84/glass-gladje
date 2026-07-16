import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useCart } from '../lib/cart'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/PageShell'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

type Recommendation = {
  productId: string
  slug: string
  nameSv: string
  shortDescriptionSv: string
  reasonSv: string
  fromPriceSekInclVat: number
  dietaryTags: string[]
  suggestedVariantId?: string | null
  suggestedVariantLabel?: string | null
}

type AgentResponse = {
  replyText: string
  recommendations: Recommendation[]
  speechAvailable: boolean
  speechAudioBase64?: string | null
  speechContentType?: string | null
  personaName: string
}

type AgentStatus = {
  speechConfigured: boolean
  ready: boolean
}

type SpeechRecognitionResultLike = { 0: { transcript: string }; isFinal: boolean }
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> }
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function ConversationalAiPage() {
  const { addItem } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hej! Jag är din smakrådgivare hos Glassglädje. Ring eller skriv: berätta om tillfälle, favoritsmaker eller allergier, så plockar jag fram förslag åt dig.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [listening, setListening] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [speechConfigured, setSpeechConfigured] = useState(false)
  const [includeSpeech, setIncludeSpeech] = useState(true)
  const [addedId, setAddedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoCallStarted = useRef(false)

  useEffect(() => {
    void api
      .get<AgentStatus>('/elevenagent/status')
      .then((r) => setSpeechConfigured(r.data.speechConfigured))
      .catch(() => setSpeechConfigured(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, listening])

  const playSpeech = useCallback((base64: string, contentType: string) => {
    try {
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: contentType || 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
      const audio = new Audio(url)
      audioRef.current = audio
      void audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch {
      /* ignore playback errors */
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setError(null)
      setLoading(true)
      const history = [...messages, { role: 'user' as const, content: trimmed }]
      setMessages(history)
      setInput('')

      try {
        const { data } = await api.post<AgentResponse>('/elevenagent/chat', {
          message: trimmed,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          includeSpeech: includeSpeech || inCall,
        })

        setMessages((prev) => [...prev, { role: 'assistant', content: data.replyText }])
        setRecommendations(data.recommendations ?? [])

        if (data.speechAvailable && data.speechAudioBase64) {
          playSpeech(data.speechAudioBase64, data.speechContentType || 'audio/mpeg')
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number; data?: { message?: string } } })
          ?.response?.status
        if (status === 429) {
          setError(
            'Smakrådgivaren tar en kort paus – för många frågor på kort tid. Försök igen om en stund.',
          )
        } else {
          setError(
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Smakrådgivaren tar en kort paus. Skriv din fråga så försöker vi igen.',
          )
        }
      } finally {
        setLoading(false)
      }
    },
    [includeSpeech, inCall, loading, messages, playSpeech],
  )

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setError('Röstinmatning stöds inte i den här webbläsaren. Skriv din fråga i stället.')
      return
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    const recognition = new Ctor()
    recognition.lang = 'sv-SE'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (ev) => {
      const transcript = Array.from(ev.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) {
        setInput(transcript)
        void sendMessage(transcript)
      }
    }
    recognition.onerror = () => {
      setListening(false)
      setError('Kunde inte höra dig. Kontrollera mikrofonbehörighet eller skriv i stället.')
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    setError(null)
    setListening(true)
    recognition.start()
  }, [listening, sendMessage])

  const startCall = useCallback(() => {
    setInCall(true)
    setIncludeSpeech(true)
    setError(null)
    // slight delay so UI paints before mic prompt
    window.setTimeout(() => startListening(), 150)
  }, [startListening])

  const endCall = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* ignore */
      }
    }
    setListening(false)
    setInCall(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  // Deep link: /conversational-ai?call=1 or #call
  useEffect(() => {
    if (autoCallStarted.current) return
    const wantsCall =
      searchParams.get('call') === '1' || window.location.hash === '#call'
    if (!wantsCall) return
    autoCallStarted.current = true
    startCall()
    if (searchParams.get('call') === '1') {
      const next = new URLSearchParams(searchParams)
      next.delete('call')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, startCall])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void sendMessage(input)
  }

  function addRecommendation(rec: Recommendation) {
    if (!rec.suggestedVariantId) return
    addItem({
      productVariantId: rec.suggestedVariantId,
      productName: rec.nameSv,
      variantLabel: rec.suggestedVariantLabel || 'Burk',
      unitPriceInclVat: rec.fromPriceSekInclVat,
      slug: rec.slug,
    })
    setAddedId(rec.productId)
    setTimeout(() => setAddedId(null), 2000)
  }

  return (
    <div className="bg-off-white pb-24">
      <Container className="py-12 sm:py-16 max-w-5xl">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold mb-3">
            Personlig rådgivning
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-charcoal">
            Smakrådgivare
          </h1>
          <p className="mt-3 text-charcoal/55 max-w-lg mx-auto leading-relaxed">
            Ring eller skriv – vi hjälper dig hitta rätt glass utifrån tillfälle, favoriter och
            allergier.
          </p>
        </div>

        {/* Call stage */}
        <div
          id="call"
          className={`mb-8 rounded-[1.75rem] border px-6 py-8 sm:px-10 sm:py-10 text-center transition-colors duration-300 ${
            inCall
              ? 'border-gold/30 bg-charcoal text-off-white shadow-[0_24px_60px_-20px_rgba(28,25,23,0.45)]'
              : 'border-charcoal/[0.06] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]'
          }`}
        >
          <div
            className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
              inCall
                ? 'bg-gold/20 text-gold animate-soft-pulse'
                : 'bg-creamy-beige text-charcoal/70'
            }`}
          >
            <PhoneGlyph className="h-8 w-8" />
          </div>
          <h2
            className={`font-display text-xl sm:text-2xl font-medium tracking-tight ${
              inCall ? 'text-off-white' : 'text-charcoal'
            }`}
          >
            {inCall
              ? listening
                ? 'Lyssnar… prata nu'
                : loading
                  ? 'Tänker…'
                  : 'I samtal – tryck för att tala'
              : 'Ring smakrådgivare'}
          </h2>
          <p
            className={`mt-2 text-sm max-w-md mx-auto ${
              inCall ? 'text-off-white/55' : 'text-charcoal/50'
            }`}
          >
            {inCall
              ? 'Berätta om tillfälle, favoritsmaker eller allergier. Svar kan läsas upp högt.'
              : 'Starta ett röstsamtal för personliga glassråd – mikrofon krävs.'}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {!inCall ? (
              <Button type="button" variant="dark" onClick={startCall} className="min-w-[10rem]">
                Ring nu
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant={listening ? 'primary' : 'outline'}
                  onClick={startListening}
                  className={
                    listening
                      ? ''
                      : inCall
                        ? '!border-off-white/25 !text-off-white hover:!bg-off-white/10'
                        : ''
                  }
                  disabled={loading}
                >
                  {listening ? 'Stoppa mikrofon' : 'Tala'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={endCall}
                  className="!border-red-300/40 !text-red-200 hover:!bg-red-500/15"
                >
                  Lägg på
                </Button>
              </>
            )}
          </div>
          {speechConfigured && (
            <p className={`mt-4 text-[11px] tracking-wide ${inCall ? 'text-off-white/35' : 'text-charcoal/35'}`}>
              Röstuppläsning aktiv via ElevenLabs
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Chat */}
          <div className="lg:col-span-3 rounded-[1.5rem] border border-charcoal/[0.06] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col min-h-[420px]">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 max-h-[480px]">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-charcoal text-off-white'
                        : 'bg-creamy-beige/70 text-charcoal border border-charcoal/[0.04]'
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <p className="text-[10px] uppercase tracking-[0.16em] text-gold mb-1.5">
                        Smakrådgivare
                      </p>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-sm text-charcoal/40 px-1">Smakrådgivaren smakar sig fram…</p>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-charcoal/[0.05] p-4 flex flex-col gap-2.5 bg-off-white/60 rounded-b-[1.5rem]"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Berätta om tillfälle, favoritsmaker eller allergier…"
                  className="flex-1 rounded-full border border-charcoal/10 bg-white px-4 py-3 text-sm placeholder:text-charcoal/35 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
                  disabled={loading}
                  aria-label="Meddelande till smakrådgivaren"
                />
                <button
                  type="button"
                  onClick={startListening}
                  className={`rounded-full px-4 py-3 text-sm font-medium border transition ${
                    listening
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-white border-charcoal/10 text-charcoal hover:border-charcoal/20'
                  }`}
                  aria-pressed={listening}
                  title="Tala med smakrådgivaren"
                >
                  {listening ? 'Stoppa' : '🎤'}
                </button>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-off-white disabled:opacity-50 hover:bg-charcoal/90 transition"
                >
                  Skicka
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-charcoal/50 px-1">
                <input
                  type="checkbox"
                  checked={includeSpeech}
                  onChange={(e) => setIncludeSpeech(e.target.checked)}
                  disabled={!speechConfigured}
                  className="rounded border-charcoal/20"
                />
                Läs upp svar (ElevenLabs)
                {!speechConfigured && ' – ej konfigurerat'}
              </label>
              {error && <p className="text-sm text-red-700 px-1">{error}</p>}
            </form>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-display text-xl font-medium tracking-tight text-charcoal">
              Rekommendationer
            </h2>
            {recommendations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-charcoal/10 bg-creamy-beige/40 p-6 text-sm text-charcoal/50 leading-relaxed">
                Dina personliga smakförslag dyker upp här efter en fråga.
                <p className="mt-3 text-charcoal/40">
                  Tips: ”vegansk fest”, ”något med choklad”, ”utan nötter till fika”
                </p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <article
                  key={rec.productId}
                  className="rounded-2xl border border-charcoal/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {rec.dietaryTags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] uppercase tracking-[0.1em] rounded-full bg-creamy-beige px-2 py-0.5 text-charcoal/50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-display text-lg font-medium">
                    <Link to={`/butik/${rec.slug}`} className="hover:text-soft-brown transition-colors">
                      {rec.nameSv}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-sm text-charcoal/55 leading-relaxed">{rec.reasonSv}</p>
                  <p className="mt-2.5 font-semibold text-sm tracking-tight">
                    från {rec.fromPriceSekInclVat.toFixed(0)} kr
                    {rec.suggestedVariantLabel && (
                      <span className="font-normal text-charcoal/40">
                        {' '}
                        · {rec.suggestedVariantLabel}
                      </span>
                    )}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {rec.suggestedVariantId && (
                      <button
                        type="button"
                        onClick={() => addRecommendation(rec)}
                        className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-off-white hover:bg-charcoal/90 transition"
                      >
                        {addedId === rec.productId ? 'Tillagd!' : 'Lägg i korgen'}
                      </button>
                    )}
                    <Link
                      to={`/butik/${rec.slug}`}
                      className="rounded-full border border-charcoal/12 bg-white px-4 py-2 text-sm font-medium text-charcoal/80 hover:border-charcoal/25 transition"
                    >
                      Visa smak
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

function PhoneGlyph({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 4.5c.4-1 1.4-1.5 2.4-1.3l1.2.3c.9.2 1.5 1 1.5 1.9v1.6c0 .8-.5 1.5-1.2 1.8l-1 .4a12.5 12.5 0 0 0 5.4 5.4l.4-1c.3-.7 1-1.2 1.8-1.2h1.6c.9 0 1.7.6 1.9 1.5l.3 1.2c.2 1-.3 2-1.3 2.4A15.5 15.5 0 0 1 4.5 6.8c.4-1 1.4-1.5 2.4-1.3l1.6.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
