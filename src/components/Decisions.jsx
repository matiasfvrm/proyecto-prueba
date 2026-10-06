import { useId, useMemo, useState } from 'react'
import { ArrowRight, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'
import { Reveal, SectionHeader } from './ui'
import { cx, num, pct, usd } from '../lib'

// Baseline: Nova Coffee, one month.
const BASE = { price: 5.4, revenue: 18430, customers: 1284, margin: 0.58, satisfaction: 82 }
const FIXED = BASE.revenue * BASE.margin - 3510 // monthly fixed costs that keep profit at $3,510

function simulate(p) {
  // Demand gets more sensitive the further you move from the market price.
  const elasticity = p >= 0 ? -1.1 - p * 1.6 : -0.75
  const demand = Math.max(0.2, 1 + elasticity * p)
  const price = BASE.price * (1 + p)
  const revenue = BASE.revenue * (1 + p) * demand
  const margin = 1 - (1 - BASE.margin) / (1 + p)
  const profit = revenue * margin - FIXED
  const customers = Math.round(BASE.customers * demand)
  const satisfaction = Math.max(20, Math.min(96, BASE.satisfaction - (p > 0 ? 70 * p ** 1.15 : 30 * p)))
  return { price, revenue, margin, profit, customers, satisfaction }
}

const before = simulate(0)

function Row({ label, a, b, delta, good }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line py-3 last:border-b-0 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
      <dt className="text-sm text-dim">{label}</dt>
      <dd className="tnum hidden font-mono text-sm text-mute sm:block">{a}</dd>
      <dd className="tnum font-mono text-sm">{b}</dd>
      <dd
        className={cx(
          'tnum w-20 text-right font-mono text-xs',
          good === null ? 'text-mute' : good ? 'text-pos' : 'text-neg',
        )}
      >
        {delta}
      </dd>
    </div>
  )
}

export default function Decisions() {
  const [p, setP] = useState(0.15)
  const id = useId()
  const after = useMemo(() => simulate(p), [p])

  const d = (a, b) => ((b - a) / a) * 100
  const tone = (v, higherIsGood = true) => (Math.abs(v) < 0.05 ? null : (v > 0) === higherIsGood)

  const consequences = useMemo(() => {
    const list = []
    if (p > 0.005) {
      list.push({ good: true, text: 'Higher margins', detail: `Gross margin rises to ${(after.margin * 100).toFixed(0)}%` })
      list.push({ good: false, text: 'Lower demand', detail: `${num(before.customers - after.customers)} fewer customers per month` })
      list.push({ good: false, text: 'Customer dissatisfaction', detail: `Satisfaction drops ${(before.satisfaction - after.satisfaction).toFixed(0)} points` })
      list.push({ good: true, text: 'More cash per sale', detail: `Each order brings in ${usd(after.price - before.price, { decimals: 2 })} more` })
    } else if (p < -0.005) {
      list.push({ good: true, text: 'Higher demand', detail: `${num(after.customers - before.customers)} more customers per month` })
      list.push({ good: false, text: 'Thinner margins', detail: `Gross margin falls to ${(after.margin * 100).toFixed(0)}%` })
      list.push({ good: true, text: 'Happier customers', detail: `Satisfaction rises ${(after.satisfaction - before.satisfaction).toFixed(0)} points` })
      list.push({ good: false, text: 'More work per dollar', detail: 'Staff serve more orders for less profit' })
    }
    return list
  }, [p, after])

  const warning =
    p >= 0.2
      ? 'Competitors may undercut you within 2–3 months. Brand loyalty will be tested.'
      : p <= -0.1
        ? 'Discount-driven customers churn fast when prices return to normal.'
        : null

  return (
    <section aria-labelledby="dec-title" className="relative border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeader index="03" label="Decisions" title={<span id="dec-title">There is no perfect answer.</span>}>
              VentureSim is not a multiple-choice quiz. There is no “correct” option waiting to be selected. Every
              decision changes the business — usually in more than one direction at once.
            </SectionHeader>
            <Reveal delay={240} className="mt-10 space-y-4 text-sm leading-relaxed text-dim">
              <p>
                Raise prices and you earn more per sale — but fewer people buy. Cut prices and you sell more — but every
                sale is worth less. Whether that trade is worth it depends on your costs, your customers, and your
                competitors.
              </p>
              <p className="text-fg">Try it. Move the slider and watch the business respond.</p>
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:col-span-7">
            <div className="border border-line-2 bg-ink-2">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Decision · Nova Coffee · Pricing</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">Projection</span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <label htmlFor={id} className="text-lg font-semibold sm:text-xl">
                    {p === 0 ? 'Keep current prices' : `${p > 0 ? 'Increase' : 'Decrease'} price by ${Math.abs(Math.round(p * 100))}%`}
                  </label>
                  <span className="tnum font-mono text-2xl text-gold sm:text-3xl">{pct(p * 100, { decimals: 0 })}</span>
                </div>
                <input
                  id={id}
                  type="range"
                  min={-20}
                  max={30}
                  step={1}
                  value={Math.round(p * 100)}
                  onChange={(e) => setP(Number(e.target.value) / 100)}
                  className="range mt-5"
                  aria-valuetext={`${Math.round(p * 100)} percent price change`}
                />
                <div className="relative mt-2 h-4 font-mono text-[10px] text-mute" aria-hidden="true">
                  <span className="absolute left-0">−20%</span>
                  <span className="absolute left-[40%] -translate-x-1/2">0</span>
                  <span className="absolute right-0">+30%</span>
                </div>

                {/* Before / after */}
                <div className="mt-8">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mute sm:grid-cols-[1.2fr_1fr_1fr_auto]">
                    <span>Metric</span>
                    <span className="hidden sm:block">Before</span>
                    <span className="flex items-center gap-1.5">
                      <ArrowRight className="hidden size-3 sm:block" aria-hidden="true" /> After
                    </span>
                    <span className="w-20 text-right">Change</span>
                  </div>
                  <dl className="border-t border-line">
                    <Row label="Avg. ticket" a={usd(before.price, { decimals: 2 })} b={usd(after.price, { decimals: 2 })} delta={pct(d(before.price, after.price))} good={tone(p * 100)} />
                    <Row label="Customers / mo" a={num(before.customers)} b={num(after.customers)} delta={pct(d(before.customers, after.customers))} good={tone(after.customers - before.customers)} />
                    <Row label="Revenue / mo" a={usd(before.revenue)} b={usd(after.revenue)} delta={pct(d(before.revenue, after.revenue))} good={tone(after.revenue - before.revenue)} />
                    <Row label="Gross margin" a={`${(before.margin * 100).toFixed(1)}%`} b={`${(after.margin * 100).toFixed(1)}%`} delta={`${pct((after.margin - before.margin) * 100)} pts`} good={tone((after.margin - before.margin) * 100)} />
                    <Row label="Profit / mo" a={usd(before.profit)} b={usd(after.profit)} delta={pct(d(before.profit, after.profit))} good={tone(after.profit - before.profit)} />
                    <Row label="Satisfaction" a={before.satisfaction.toFixed(0)} b={after.satisfaction.toFixed(0)} delta={`${pct(after.satisfaction - before.satisfaction, { decimals: 0 })} pts`} good={tone(after.satisfaction - before.satisfaction)} />
                  </dl>
                </div>
              </div>

              <div className="border-t border-line bg-panel p-5 sm:p-6" aria-live="polite">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Possible consequences</div>
                {consequences.length ? (
                  <ul className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    {consequences.map((c) => (
                      <li key={c.text} className="flex gap-3">
                        <span
                          className={cx('mt-0.5 grid size-5 shrink-0 place-items-center', c.good ? 'bg-pos/15 text-pos' : 'bg-neg/15 text-neg')}
                        >
                          {c.good ? <TrendingUp className="size-3" aria-hidden="true" /> : <TrendingDown className="size-3" aria-hidden="true" />}
                        </span>
                        <span>
                          <span className="block text-sm font-medium">
                            <span className="sr-only">{c.good ? 'Upside: ' : 'Downside: '}</span>
                            {c.text}
                          </span>
                          <span className="tnum block text-xs text-dim">{c.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-dim">Nothing changes today. But your rent, suppliers, and competitors won’t wait.</p>
                )}
                {warning && (
                  <p className="mt-5 flex gap-2.5 border-t border-line pt-4 text-xs leading-relaxed text-gold">
                    <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="font-mono uppercase tracking-[0.12em]">Second-order effect · </span>
                      {warning}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
