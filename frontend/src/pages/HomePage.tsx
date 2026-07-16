import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { type PagedResult, type ProductListItem } from '../lib/api'
import { ProductCard } from '../components/ProductCard'
import { ButtonLink } from '../components/ui/Button'
import { Container, Section, SectionHeader } from '../components/ui/PageShell'

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data } = await api.get<PagedResult<ProductListItem>>('/products', {
        params: { pageSize: 6 },
      })
      return data
    },
  })

  return (
    <div>
      {/* 1. Hero – full-bleed video banner */}
      <section className="relative isolate min-h-[min(90vh,760px)] overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/images/hero/hero-poster.jpg"
          aria-hidden="true"
        >
          <source src="/images/hero/hero.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/55 to-charcoal/20"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-charcoal/25"
          aria-hidden="true"
        />

        <Container className="relative z-10 flex min-h-[min(90vh,760px)] items-center py-20 sm:py-24">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold mb-5">
              Premiumglass från Sverige
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-medium tracking-tight text-off-white leading-[1.08]">
              Varje sked – en stund av ren{' '}
              <span className="italic text-peach">glädje</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-off-white/70 max-w-md leading-relaxed font-light">
              Småskalig premiumglass, tillverkad med omtanke och levererad till din dörr.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/butik" variant="primary">
                Handla nu
              </ButtonLink>
              <ButtonLink
                to="/conversational-ai?call=1"
                variant="outline"
                className="!border-off-white/30 !text-off-white hover:!bg-off-white/10 hover:!border-off-white/50"
              >
                Ring smakrådgivare
              </ButtonLink>
            </div>
            <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-off-white/40">
              Solmogen sommar i varje burk
            </p>
          </div>
        </Container>
      </section>

      {/* 2. Why us */}
      <Section muted>
        <SectionHeader eyebrow="Därför Glassglädje" title="Omtanke i varje sats" />
        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              title: 'Små batcher',
              text: 'Vi kokar i begränsade omgångar så varje sats får den omsorg den förtjänar.',
            },
            {
              title: 'Äkta råvaror',
              text: 'Jordgubbar i säsong, äkta vaniljstång, pistage från Sicilien – inget konstlat.',
            },
            {
              title: 'Personlig rådgivning',
              text: 'Ring vår smakrådgivare för råd utifrån tillfälle, preferens och allergier.',
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white/90 border border-charcoal/[0.06] p-7 sm:p-8 shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
            >
              <span className="text-[11px] font-medium tracking-[0.2em] text-gold">
                0{i + 1}
              </span>
              <h3 className="mt-3 font-display text-xl font-medium text-charcoal">{item.title}</h3>
              <p className="mt-2.5 text-sm text-charcoal/55 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Featured products */}
      <Section id="smaker">
        <SectionHeader
          eyebrow="Sortiment"
          title="Utvalda smaker"
          description="Tolv berättelser. En sked i taget."
          action={
            <Link
              to="/butik"
              className="text-sm font-medium text-charcoal/70 hover:text-charcoal underline-offset-4 hover:underline transition-colors"
            >
              Se hela sortimentet →
            </Link>
          }
        />

        {isLoading && <p className="text-charcoal/45 text-sm">Laddar smaker…</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {(data?.items ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <ButtonLink to="/butik" variant="dark">
            Till butiken
          </ButtonLink>
        </div>
      </Section>

      {/* 4. Call / agent CTA */}
      <Section muted className="!border-b-0">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-charcoal/[0.06] bg-charcoal px-6 py-12 sm:px-14 sm:py-16 text-center max-w-3xl mx-auto shadow-[0_24px_60px_-24px_rgba(28,25,23,0.4)]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(196,165,116,0.18),_transparent_55%)]"
            aria-hidden="true"
          />
          <p className="relative text-[11px] uppercase tracking-[0.22em] text-gold mb-4">
            Smakrådgivning
          </p>
          <h2 className="relative font-display text-2xl sm:text-3xl font-medium text-off-white tracking-tight">
            Osäker på vilken glass som passar?
          </h2>
          <p className="relative mt-4 text-off-white/55 max-w-md mx-auto leading-relaxed">
            Ring eller skriv – berätta om tillfälle, favoriter eller allergier så får du personliga
            förslag.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/conversational-ai?call=1" variant="primary">
              Ring smakrådgivare
            </ButtonLink>
            <ButtonLink
              to="/conversational-ai"
              variant="outline"
              className="!border-off-white/20 !text-off-white hover:!bg-off-white/10"
            >
              Öppna chatt
            </ButtonLink>
          </div>
        </div>
      </Section>
    </div>
  )
}
