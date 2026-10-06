import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from './ui'
import { cx } from '../lib'

const links = [
  { label: 'Product', href: '#product' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Businesses', href: '#businesses' },
  { label: 'Challenges', href: '#challenges' },
  { label: 'About', href: '#about' },
]

export function Logo({ className }) {
  return (
    <a href="#top" className={cx('flex items-center gap-2.5', className)} aria-label="VentureSim home">
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <rect x="0.5" y="0.5" width="23" height="23" fill="none" stroke="currentColor" strokeOpacity="0.25" />
        <path d="M6 7l6 10.5L18 7" fill="none" stroke="var(--color-gold)" strokeWidth="2.25" strokeLinecap="square" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.01em]">
        Venture<span className="text-dim">Sim</span>
      </span>
    </a>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
        scrolled || open ? 'border-line bg-ink/85 backdrop-blur-md' : 'border-transparent',
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="relative text-[13px] text-dim transition-colors hover:text-fg after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" href="#start">
            Sign In
          </Button>
          <Button size="sm" href="#start">
            Start Simulating
          </Button>
        </div>

        <button
          type="button"
          className="-mr-2 grid size-10 place-items-center text-fg lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="h-[calc(100dvh-4rem)] border-t border-line bg-ink px-5 pb-10 pt-4 lg:hidden"
      >
        <ul className="divide-y divide-line">
          {links.map((l, i) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-5 text-2xl font-semibold tracking-tight"
              >
                {l.label}
                <span className="font-mono text-xs text-mute">0{i + 1}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-3">
          <Button href="#start" size="lg" arrow onClick={() => setOpen(false)}>
            Start Simulating
          </Button>
          <Button href="#start" variant="secondary" size="lg" onClick={() => setOpen(false)}>
            Sign In
          </Button>
        </div>
      </div>
    </header>
  )
}
