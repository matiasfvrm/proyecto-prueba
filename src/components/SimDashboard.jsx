import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Check, CircleAlert, Pause, Play, RotateCcw } from 'lucide-react'
import { LiveDot } from './ui'
import { usePrefersReducedMotion } from '../hooks/useInView'
import { cx, num, usd } from '../lib'

const EVENTS = [
  {
    id: 'rent',
    tag: 'Lease notice',
    title: 'Your rent is increasing by 12% next month.',
    context: 'Rent is your largest fixed cost: $4,800 / month. Your landlord wants $5,376.',
    options: [
      {
        label: 'Raise prices',
        effects: [
          ['Avg. ticket', '+6.0%', 'pos'],
          ['Customers', '−3.1%', 'neg'],
          ['Monthly profit', '+$410', 'pos'],
        ],
        apply: { revenue: 0.042, customers: -0.031, expenses: 0.039 },
        outcome: 'Prices up 6%. Margins recovered — but 40 regulars started buying elsewhere.',
      },
      {
        label: 'Negotiate rent',
        effects: [
          ['Success chance', '62%', 'neu'],
          ['Rent increase', '+5% instead', 'pos'],
          ['Time to resolve', '2 weeks', 'neu'],
        ],
        apply: { expenses: 0.016 },
        outcome: 'You signed a 3-year lease in exchange for a 5% increase instead of 12%.',
      },
      {
        label: 'Move location',
        effects: [
          ['Moving cost', '−$12,400', 'neg'],
          ['Rent', '−18%', 'pos'],
          ['Foot traffic', '−9% (3 mo.)', 'neg'],
        ],
        apply: { cash: -12400, expenses: -0.058, customers: -0.09, share: -0.4 },
        outcome: 'Cheaper space, fewer walk-ins. Recovery depends on your marketing now.',
      },
      {
        label: 'Reduce staff',
        effects: [
          ['Payroll', '−$1,120 / mo', 'pos'],
          ['Wait times', '+38%', 'neg'],
          ['Satisfaction', '−6 pts', 'neg'],
        ],
        apply: { expenses: -0.036, customers: -0.024, revenue: -0.018 },
        outcome: 'Costs are down. Morning queues are longer — reviews are starting to mention it.',
      },
    ],
  },
  {
    id: 'rival',
    tag: 'Competitor',
    title: 'A specialty coffee chain is opening 300m away.',
    context: 'They have 40 locations, a loyalty app, and prices 8% below yours.',
    options: [
      {
        label: 'Launch loyalty card',
        effects: [
          ['Setup cost', '−$2,800', 'neg'],
          ['Retention', '+11%', 'pos'],
          ['Margin', '−1.2 pts', 'neg'],
        ],
        apply: { cash: -2800, customers: 0.02, expenses: 0.012 },
        outcome: 'Regulars stayed. Your repeat-visit rate is now higher than the chain’s.',
      },
      {
        label: 'Match their prices',
        effects: [
          ['Revenue', '−6.0%', 'neg'],
          ['Customers', '+1.0%', 'pos'],
          ['Price war risk', 'High', 'neg'],
        ],
        apply: { revenue: -0.06, customers: 0.01 },
        outcome: 'You kept volume — but you are now competing with a company that can outlast you.',
      },
      {
        label: 'Upgrade the menu',
        effects: [
          ['Investment', '−$5,500', 'neg'],
          ['Avg. ticket', '+5.5%', 'pos'],
          ['Positioning', 'Premium', 'neu'],
        ],
        apply: { cash: -5500, revenue: 0.035, share: 0.2 },
        outcome: 'You stopped competing on price. A different customer is walking in now.',
      },
      {
        label: 'Ignore it',
        effects: [
          ['Cost', '$0', 'pos'],
          ['Customers', '−7.0%', 'neg'],
          ['Market share', '−0.6 pts', 'neg'],
        ],
        apply: { customers: -0.07, revenue: -0.05, share: -0.6 },
        outcome: 'The chain took 90 of your customers in the first month.',
      },
    ],
  },
  {
    id: 'barista',
    tag: 'Team',
    title: 'Your head barista wants a 15% raise — or they walk.',
    context: 'They trained your whole team and know 300 regulars by name.',
    options: [
      {
        label: 'Approve the raise',
        effects: [
          ['Payroll', '+$540 / mo', 'neg'],
          ['Team morale', '+12%', 'pos'],
          ['Turnover risk', 'Low', 'pos'],
        ],
        apply: { expenses: 0.036 },
        outcome: 'They stayed — and asked to help open a second location someday.',
      },
      {
        label: 'Offer profit share',
        effects: [
          ['Fixed cost', '$0', 'pos'],
          ['Profit share', '5%', 'neg'],
          ['Incentives', 'Aligned', 'pos'],
        ],
        apply: { expenses: 0.012, revenue: 0.01 },
        outcome: 'They accepted. Upselling went up the following week.',
      },
      {
        label: 'Promote from within',
        effects: [
          ['Payroll', '+$180 / mo', 'neg'],
          ['Service quality', '−4%', 'neg'],
          ['Ramp-up', '6 weeks', 'neu'],
        ],
        apply: { expenses: 0.012, customers: -0.015 },
        outcome: 'Your new lead is learning fast. A few regulars noticed the change.',
      },
      {
        label: 'Let them go',
        effects: [
          ['Payroll', '−$3,600 / mo', 'pos'],
          ['Regulars lost', '~60', 'neg'],
          ['Hiring cost', '−$1,200', 'neg'],
        ],
        apply: { expenses: -0.06, customers: -0.045, revenue: -0.04, cash: -1200 },
        outcome: 'Cheaper — until you counted how many regulars followed them out the door.',
      },
    ],
  },
]

const INITIAL = { cash: 47820, revenue: 18430, expenses: 14920, customers: 1284, share: 4.8 }
const SPEEDS = [1, 2, 4]

function seedSeries() {
  const rev = []
  const exp = []
  for (let i = 0; i < 32; i++) {
    const t = i / 31
    rev.push(14800 + t * 3500 + Math.sin(i * 0.9) * 420 + Math.cos(i * 2.3) * 260)
    exp.push(13600 + t * 1300 + Math.sin(i * 0.6 + 1) * 220)
  }
  rev[31] = INITIAL.revenue
  exp[31] = INITIAL.expenses
  return { rev, exp }
}

function Chart({ rev, exp }) {
  const W = 600
  const H = 140
  const all = [...rev, ...exp]
  const min = Math.min(...all) * 0.97
  const max = Math.max(...all) * 1.02
  const x = (i) => (i / (rev.length - 1)) * W
  const y = (v) => H - ((v - min) / (max - min)) * H
  const line = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line(rev)} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-gold)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgb(255 255 255 / 0.05)" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={area} fill="url(#revFill)" />
      <path d={line(exp)} fill="none" stroke="var(--color-mute)" strokeWidth="1.25" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <path d={line(rev)} fill="none" stroke="var(--color-gold)" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
      <circle cx={x(rev.length - 1)} cy={y(rev[rev.length - 1])} r="3.5" fill="var(--color-gold)" />
    </svg>
  )
}

function Kpi({ label, value, sub, tone, className }) {
  return (
    <div className={cx('bg-panel px-4 py-3.5', className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{label}</div>
      <div
        className={cx(
          'tnum mt-1.5 font-mono text-[17px] font-medium tracking-tight sm:text-xl',
          tone === 'pos' && 'text-pos',
          tone === 'neg' && 'text-neg',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 font-mono text-[10px] text-mute">{sub}</div>}
    </div>
  )
}

export default function SimDashboard() {
  const reduced = usePrefersReducedMotion()
  const [m, setM] = useState(INITIAL)
  const [series, setSeries] = useState(seedSeries)
  const [clock, setClock] = useState({ month: 14, day: 12 })
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [eventIdx, setEventIdx] = useState(0)
  const [choice, setChoice] = useState(null)
  const [resolved, setResolved] = useState(null)
  const mRef = useRef(m)
  mRef.current = m

  const profit = m.revenue - m.expenses
  const event = EVENTS[eventIdx]

  // Live simulation tick: small, plausible drift in the numbers.
  useEffect(() => {
    if (!running || reduced) return
    const id = setInterval(() => {
      const cur = mRef.current
      const revenue = cur.revenue * (1 + (Math.random() - 0.42) * 0.008)
      const expenses = cur.expenses * (1 + (Math.random() - 0.5) * 0.004)
      const customers = Math.max(0, Math.round(cur.customers + (Math.random() - 0.4) * 6))
      const cash = cur.cash + (revenue - expenses) / 30
      const share = Math.max(0.1, cur.share + (Math.random() - 0.45) * 0.02)
      setM({ cash, revenue, expenses, customers, share })
      setSeries((s) => ({ rev: [...s.rev.slice(1), revenue], exp: [...s.exp.slice(1), expenses] }))
      setClock((c) => (c.day >= 30 ? { month: c.month + 1, day: 1 } : { ...c, day: c.day + 1 }))
    }, 2200 / speed)
    return () => clearInterval(id)
  }, [running, speed, reduced])

  // After a decision resolves, queue the next event.
  useEffect(() => {
    if (!resolved) return
    const id = setTimeout(() => {
      setResolved(null)
      setChoice(null)
      setEventIdx((i) => (i + 1) % EVENTS.length)
    }, 6500)
    return () => clearTimeout(id)
  }, [resolved])

  const confirm = () => {
    const opt = event.options[choice]
    const a = opt.apply
    setM((cur) => ({
      cash: cur.cash + (a.cash || 0),
      revenue: cur.revenue * (1 + (a.revenue || 0)),
      expenses: cur.expenses * (1 + (a.expenses || 0)),
      customers: Math.round(cur.customers * (1 + (a.customers || 0))),
      share: Math.max(0.1, cur.share + (a.share || 0)),
    }))
    setResolved(opt)
  }

  const reset = () => {
    setM(INITIAL)
    setSeries(seedSeries())
    setClock({ month: 14, day: 12 })
    setEventIdx(0)
    setChoice(null)
    setResolved(null)
  }

  const health = useMemo(() => {
    const runway = profit >= 0 ? null : m.cash / -profit
    if (profit >= 0) return { label: 'Profitable', tone: 'pos' }
    if (runway < 6) return { label: `Runway ${runway.toFixed(1)} mo`, tone: 'neg' }
    return { label: 'Burning cash', tone: 'neg' }
  }, [profit, m.cash])

  return (
    <div
      className="relative overflow-hidden border border-line-2 bg-ink-2 shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.02)]"
      role="region"
      aria-label="Interactive preview of a VentureSim business simulation"
    >
      {/* Window bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <LiveDot />
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
            Business simulation <span className="text-mute">/ run #0417</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="grid size-7 place-items-center text-dim transition-colors hover:bg-white/5 hover:text-fg"
            aria-label={running ? 'Pause simulation' : 'Resume simulation'}
          >
            {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <div className="flex border border-line" role="group" aria-label="Simulation speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                className={cx(
                  'h-7 px-2 font-mono text-[10px] transition-colors',
                  speed === s ? 'bg-white/10 text-fg' : 'text-mute hover:text-fg',
                )}
              >
                {s}×
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={reset}
            className="grid size-7 place-items-center text-dim transition-colors hover:bg-white/5 hover:text-fg"
            aria-label="Restart simulation"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Business header */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-5 sm:px-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Business</div>
          <div className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">NOVA COFFEE</div>
          <div className="mt-1 text-xs text-dim">Specialty café · Downtown · 6 employees</div>
        </div>
        <div className="flex items-center gap-3 sm:block sm:text-right">
          <div className="tnum font-mono text-[11px] text-dim">
            Month {clock.month} · Day {String(clock.day).padStart(2, '0')}
          </div>
          <div
            className={cx(
              'inline-flex items-center gap-1.5 border px-2 sm:mt-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]',
              health.tone === 'pos' ? 'border-pos/30 text-pos' : 'border-neg/40 text-neg',
            )}
          >
            {health.label}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-3">
        <Kpi label="Cash" value={usd(m.cash)} sub="in the bank" />
        <Kpi label="Revenue" value={usd(m.revenue)} sub="/ month" />
        <Kpi label="Expenses" value={usd(m.expenses)} sub="/ month" />
        <Kpi label="Profit" value={usd(profit, { sign: true })} sub="/ month" tone={profit >= 0 ? 'pos' : 'neg'} />
        <Kpi label="Customers" value={num(m.customers)} sub="active" />
        <Kpi label="Market share" value={`${m.share.toFixed(1)}%`} sub="local market" />
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 sm:px-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Last 32 days</span>
          <div className="flex items-center gap-4 font-mono text-[10px] text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-px w-3 bg-gold" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-px w-3 border-t border-dashed border-mute" /> Expenses
            </span>
          </div>
        </div>
        <div className="mt-2 h-24 sm:h-28">
          <Chart rev={series.rev} exp={series.exp} />
        </div>
      </div>

      {/* Decision */}
      <div className="m-4 mt-4 border border-gold/30 bg-gold/[0.04] sm:m-5" aria-live="polite">
        <div className="flex items-center justify-between border-b border-gold/20 px-4 py-2">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
            <CircleAlert className="size-3.5" aria-hidden="true" />
            Decision required · {event.tag}
          </span>
          <span className="font-mono text-[10px] text-mute">
            {eventIdx + 1}/{EVENTS.length}
          </span>
        </div>

        <div className="p-4">
          {resolved ? (
            <div key="resolved" className="animate-[fade_.4s_ease]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center bg-gold text-ink">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[15px] font-medium leading-snug">Decision logged: {resolved.label}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-dim">{resolved.outcome}</p>
                </div>
              </div>
              <div className="mt-4 h-px overflow-hidden bg-line">
                <div className="h-full origin-left animate-[grow_6.5s_linear] bg-gold/70" />
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                Simulating consequences… next event incoming
              </p>
            </div>
          ) : (
            <div key={event.id}>
              <p className="text-[15px] font-medium leading-snug sm:text-base">{event.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-dim">{event.context}</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg">What do you do?</p>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {event.options.map((o, i) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setChoice(i)}
                    aria-pressed={choice === i}
                    className={cx(
                      'group flex items-center justify-between gap-2 border px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200',
                      choice === i
                        ? 'border-gold bg-gold/10 text-fg'
                        : 'border-line-2 bg-panel text-dim hover:border-fg/40 hover:text-fg',
                    )}
                  >
                    {o.label}
                    <ArrowUpRight
                      className={cx(
                        'size-3.5 shrink-0 transition-all',
                        choice === i ? 'text-gold' : 'opacity-0 group-hover:opacity-60',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>

              {choice !== null && (
                <div className="mt-3 border-t border-line pt-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Projected impact</div>
                  <dl className="mt-2 grid grid-cols-3 gap-2">
                    {event.options[choice].effects.map(([k, v, tone]) => (
                      <div key={k}>
                        <dt className="truncate text-[11px] text-mute">{k}</dt>
                        <dd
                          className={cx(
                            'tnum font-mono text-[13px]',
                            tone === 'pos' && 'text-pos',
                            tone === 'neg' && 'text-neg',
                            tone === 'neu' && 'text-fg',
                          )}
                        >
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={confirm}
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 bg-gold font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-gold-hi"
                  >
                    Commit decision
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
