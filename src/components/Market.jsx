import { Banknote, Flame, Landmark, Store, TrendingDown, TrendingUp, Truck, Users } from 'lucide-react'
import { Reveal, SectionHeader } from './ui'
import { cx } from '../lib'

const EVENTS = [
  { icon: TrendingUp, title: 'Demand increases', body: 'Orders spike. Can your staff and inventory keep up — or do you disappoint new customers?', hits: ['Revenue', 'Inventory', 'Staff'], tone: 'pos' },
  { icon: Banknote, title: 'Supplier prices rise', body: 'Your cost per unit jumps 9%. Absorb it, pass it on, or find a new supplier.', hits: ['Margins', 'Pricing'], tone: 'neg' },
  { icon: Landmark, title: 'Interest rates increase', body: 'Your loan payments grow. Financing that expansion just got more expensive.', hits: ['Debt', 'Cash'], tone: 'neg' },
  { icon: Users, title: 'Consumer preferences change', body: 'What sold last year is losing appeal. Adapt the product or watch demand drift.', hits: ['Demand', 'Brand'], tone: 'neu' },
  { icon: Store, title: 'A new competitor enters', body: 'Well-funded, lower prices, louder marketing. Your market share is on the table.', hits: ['Market share', 'Pricing'], tone: 'neg' },
  { icon: TrendingDown, title: 'The economy slows down', body: 'Customers spend less and pay later. Cash becomes the only metric that matters.', hits: ['Demand', 'Cash flow'], tone: 'neg' },
  { icon: Truck, title: 'Supply chain disruption', body: 'Shipments are six weeks late. Stockouts start costing you customers.', hits: ['Inventory', 'Satisfaction'], tone: 'neg' },
  { icon: Flame, title: 'Viral marketing opportunity', body: 'A post about you is spreading. You have 72 hours to capitalize — if you can.', hits: ['Brand', 'Customers'], tone: 'pos' },
]

const TICKER = [
  ['CPI', '+0.4%', 'neg'],
  ['Base rate', '5.25% → 5.50%', 'neg'],
  ['Coffee futures', '+7.2%', 'neg'],
  ['Consumer confidence', '−3 pts', 'neg'],
  ['Local foot traffic', '+6.1%', 'pos'],
  ['New competitors (area)', '2', 'neu'],
  ['Avg. wage', '+3.8% YoY', 'neg'],
  ['Online search interest', '+14%', 'pos'],
  ['Freight costs', '−5.0%', 'pos'],
]

const toneText = { pos: 'text-pos', neg: 'text-neg', neu: 'text-dim' }

export default function Market() {
  return (
    <section aria-labelledby="mkt-title" className="relative border-t border-line bg-ink-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionHeader index="06" label="Dynamic market" title={<span id="mkt-title">The market doesn’t stay still.</span>} />
          </div>
          <Reveal delay={160} className="text-lg leading-relaxed text-dim lg:col-span-5">
            Economies slow down. Suppliers raise prices. Competitors appear overnight. A strategy that worked in month 3
            can sink you in month 12. You don’t win by following a fixed plan — you win by adapting.
          </Reveal>
        </div>
      </div>

      {/* Market feed */}
      <div className="relative mt-14 overflow-hidden border-y border-line bg-ink py-3" aria-label="Simulated market feed">
        <div className="flex w-max animate-marquee gap-10 pr-10 hover:[animation-play-state:paused]">
          {[...TICKER, ...TICKER].map(([k, v, tone], i) => (
            <span key={i} className="flex shrink-0 items-center gap-2.5 font-mono text-xs" aria-hidden={i >= TICKER.length}>
              <span className="text-mute uppercase tracking-[0.12em]">{k}</span>
              <span className={toneText[tone]}>{v}</span>
              <span className="text-line-2">/</span>
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <ul className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS.map((e, i) => {
            const Icon = e.icon
            return (
              <Reveal as="li" key={e.title} delay={(i % 4) * 70} className="group relative bg-ink-2 p-6 transition-colors duration-300 hover:bg-panel">
                <div className="flex items-center justify-between">
                  <span
                    className={cx(
                      'grid size-9 place-items-center border transition-colors duration-300',
                      e.tone === 'pos' ? 'border-pos/30 text-pos' : e.tone === 'neg' ? 'border-neg/30 text-neg' : 'border-line-2 text-dim',
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Event {String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-6 text-base font-semibold">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-dim">{e.body}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {e.hits.map((h) => (
                    <span key={h} className="border border-line-2 px-1.5 py-0.5 font-mono text-[10px] text-mute transition-colors group-hover:border-gold/40 group-hover:text-dim">
                      {h}
                    </span>
                  ))}
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
