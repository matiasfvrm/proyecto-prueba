import { useState } from 'react'
import { Check } from 'lucide-react'
import { Logo } from './Navbar'
import { Button, Reveal } from './ui'

function Signup() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <p className="flex items-center justify-center gap-2.5 font-mono text-sm text-fg" role="status">
        <span className="grid size-5 place-items-center bg-gold text-ink">
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        </span>
        You’re in. Your first $50,000 (simulated) is on its way.
      </p>
    )
  }

  return (
    <form
      className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:gap-0"
      onSubmit={(e) => {
        e.preventDefault()
        if (email) setDone(true)
      }}
    >
      <label htmlFor="cta-email" className="sr-only">
        Email address
      </label>
      <input
        id="cta-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-14 w-full min-w-0 border border-line-2 sm:flex-1 bg-ink px-4 text-[15px] text-fg placeholder:text-mute focus:border-gold focus:outline-none sm:border-r-0"
      />
      <Button type="submit" size="lg" arrow>
        Start simulating
      </Button>
    </form>
  )
}

export default function FinalCta() {
  return (
      <section id="start" aria-labelledby="cta-title" className="relative overflow-hidden border-t border-line py-28 sm:py-40">
        <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,black,transparent)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(232_176_75/0.08),transparent)]"
        />
        <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal className="eyebrow">Run #0001 is waiting</Reveal>
          <Reveal as="h2" id="cta-title" delay={80} className="display mt-6 text-[clamp(2.6rem,7.5vw,6.5rem)] text-balance">
            Your first business doesn’t have to be <span className="text-gold">real.</span>
          </Reveal>
          <Reveal as="p" delay={160} className="mt-7 text-xl text-dim sm:text-2xl">
            Build it. Break it. Learn from it. Start again.
          </Reveal>
          <Reveal delay={240} className="mt-12">
            <Signup />
          </Reveal>
          <Reveal delay={320} className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
            Your decisions. Your business. Your consequences.
          </Reveal>
        </div>
      </section>
  )
}

export function Footer() {
  return (
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Logo />
            <p className="text-sm text-mute">The business simulation laboratory.</p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dim">
              {[
                ['Product', '#product'],
                ['Businesses', '#businesses'],
                ['Challenges', '#challenges'],
                ['For educators', '#about'],
                ['About', '#about'],
              ].map(([l, h]) => (
                <li key={l}>
                  <a href={h} className="transition-colors hover:text-fg">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="font-mono text-[11px] text-mute">© {new Date().getFullYear()} VentureSim. No real money was lost.</p>
        </div>
      </footer>
  )
}
