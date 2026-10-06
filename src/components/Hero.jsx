import SimDashboard from './SimDashboard'
import { Button, Reveal } from './ui'

export default function Hero() {
  return (
    <section id="product" aria-labelledby="hero-title" className="relative overflow-hidden pt-28 pb-20 sm:pt-32 lg:pb-28">
      <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,black,transparent)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[720px] bg-[radial-gradient(closest-side,rgb(232_176_75/0.09),transparent)]"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 sm:px-8 xl:grid-cols-12 xl:gap-12">
        <div className="min-w-0 xl:col-span-6">
          <Reveal className="inline-flex items-center gap-3 border border-line-2 py-1.5 pl-1.5 pr-3">
            <span className="bg-gold px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
              Beta
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">The business simulation laboratory</span>
          </Reveal>

          <Reveal as="h1" id="hero-title" delay={80} className="display mt-7 text-[clamp(2.5rem,6vw,4.4rem)] text-balance">
            What if you could run a business{' '}
            <span className="text-gold">without losing real money?</span>
          </Reveal>

          <Reveal as="p" delay={160} className="mt-7 max-w-xl text-lg leading-relaxed text-dim text-pretty">
            VentureSim lets you build, manage, grow, and even fail businesses in a realistic simulation — so you can
            learn how business actually works by making the decisions yourself.
          </Reveal>

          <Reveal delay={240} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href="#start" size="lg" arrow>
              Start a simulation
            </Button>
            <Button href="#businesses" size="lg" variant="secondary">
              Explore businesses
            </Button>
          </Reveal>

          <Reveal delay={320} className="mt-7 flex items-center gap-3">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            <p className="text-sm text-dim">No courses. No lectures. Just decisions, consequences, and results.</p>
          </Reveal>

          <Reveal delay={400} as="dl" className="mt-12 grid max-w-lg grid-cols-3 border-t border-line pt-6">
            {[
              ['200+', 'Business types'],
              ['14', 'Live variables'],
              ['∞', 'Ways to fail'],
            ].map(([v, k]) => (
              <div key={k} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs text-mute">{k}</dt>
                <dd className="tnum font-mono text-2xl font-medium">{v}</dd>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal delay={200} className="relative min-w-0 xl:col-span-6">
          <div aria-hidden="true" className="absolute -left-3 -top-3 hidden h-6 w-6 border-l border-t border-gold/60 sm:block" />
          <div aria-hidden="true" className="absolute -bottom-3 -right-3 hidden h-6 w-6 border-b border-r border-gold/60 sm:block" />
          <SimDashboard />
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
            Live preview — pick an option and commit a decision
          </p>
        </Reveal>
      </div>
    </section>
  )
}
