import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useCart } from '../lib/cart'
import { CallWidget } from './CallWidget'
import { Logo, LogoLockup } from './Logo'
import { Container } from './ui/PageShell'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[13px] tracking-wide transition-colors duration-200 ${
    isActive
      ? 'text-charcoal font-semibold'
      : 'text-charcoal/55 hover:text-charcoal'
  }`

export function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const mainLinks = (
    <>
      <NavLink to="/butik" className={linkClass} onClick={closeMenu}>
        Butik
      </NavLink>
      <NavLink to="/conversational-ai" className={linkClass} onClick={closeMenu}>
        Smakrådgivare
      </NavLink>
      <NavLink to="/korg" className={linkClass} onClick={closeMenu}>
        Korg{itemCount > 0 ? ` (${itemCount})` : ''}
      </NavLink>
    </>
  )

  const accountLinks = user ? (
    <>
      <NavLink to="/konto" className={linkClass} onClick={closeMenu}>
        Konto
      </NavLink>
      {isAdmin && (
        <>
          <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
            Admin
          </NavLink>
          <NavLink to="/admin/bokforing" className={linkClass} onClick={closeMenu}>
            Bokföring
          </NavLink>
        </>
      )}
      <button
        type="button"
        onClick={() => {
          closeMenu()
          void logout()
        }}
        className="text-[13px] tracking-wide text-charcoal/45 hover:text-charcoal text-left transition-colors"
      >
        Logga ut
      </button>
    </>
  ) : (
    <NavLink
      to="/logga-in"
      onClick={closeMenu}
      className="inline-flex items-center rounded-full bg-charcoal px-5 py-2 text-[13px] font-medium tracking-wide text-off-white transition hover:bg-charcoal/90"
    >
      Logga in
    </NavLink>
  )

  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      <header className="sticky top-0 z-50 border-b border-charcoal/[0.06] bg-off-white/80 backdrop-blur-xl">
        <Container className="flex h-[4.25rem] items-center justify-between gap-4">
          <Logo compact onClick={closeMenu} className="shrink-0" />

          <nav
            className="hidden md:flex flex-1 items-center justify-end gap-10"
            aria-label="Huvudnavigation"
          >
            <div className="flex items-center gap-7">{mainLinks}</div>
            <div className="flex items-center gap-5 border-l border-charcoal/10 pl-7">
              {accountLinks}
            </div>
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-full border border-charcoal/10 px-3.5 py-2 text-[13px] text-charcoal"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? 'Stäng' : 'Meny'}
          </button>
        </Container>

        {menuOpen && (
          <div
            id="mobile-nav"
            className="md:hidden border-t border-charcoal/[0.06] bg-off-white/95 backdrop-blur-xl"
          >
            <Container className="flex flex-col gap-4 py-5">
              {mainLinks}
              <div className="border-t border-charcoal/[0.06] pt-4 flex flex-col gap-4">
                {accountLinks}
              </div>
            </Container>
          </div>
        )}
      </header>

      <main className="flex-1">{<Outlet />}</main>

      <footer className="mt-auto border-t border-charcoal/[0.06] bg-creamy-beige/40">
        <Container className="py-14 sm:py-16 grid gap-12 sm:grid-cols-3 text-sm">
          <div>
            <LogoLockup />
            <p className="mt-4 text-charcoal/50 leading-relaxed max-w-xs text-sm">
              Småskalig premiumglass till din dörr. Hantverk, omtanke – och glädje du kan smaka.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold mb-4">
              Shoppa
            </p>
            <ul className="space-y-2.5 text-charcoal/55">
              <li>
                <Link to="/butik" className="hover:text-charcoal transition-colors">
                  Butik
                </Link>
              </li>
              <li>
                <Link to="/conversational-ai" className="hover:text-charcoal transition-colors">
                  Smakrådgivare
                </Link>
              </li>
              <li>
                <Link to="/korg" className="hover:text-charcoal transition-colors">
                  Korg
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold mb-4">
              Info
            </p>
            <ul className="space-y-2.5 text-charcoal/55">
              <li>
                <a href="mailto:hej@glassgladje.se" className="hover:text-charcoal transition-colors">
                  hej@glassgladje.se
                </a>
              </li>
              <li>
                <Link to="/integritet" className="hover:text-charcoal transition-colors">
                  Integritetspolicy
                </Link>
              </li>
            </ul>
            <p className="mt-8 text-xs text-charcoal/35 tracking-wide">
              © {new Date().getFullYear()} Glassglädje · Priser inkl. moms
            </p>
          </div>
        </Container>
      </footer>

      <CallWidget />
    </div>
  )
}
