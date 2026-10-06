import { useState } from 'react'
import { RotateCcw, Skull } from 'lucide-react'
import { Reveal } from './ui'
import { useInView } from '../hooks/useInView'
import { cx } from '../lib'

const MISTAKES = [
  'Run out of cash',
  'Lose customers',
  'Hire too early',
  'Overexpand',
  'Take too much debt',
  'Misprice your product',
  'Lose to competitors',
]

const WHY = [
  ['Customer acquisition costs were too high', 'CAC $212 vs. $140 lifetime value per member'],
  ['Margins were too low', 'Contribution margin fell from 31% to 9%'],
  ['Expansion happened too early', 'Location #2 opened with 3.1 months of runway left'],
  ['Cash flow turned negative', '−$17,200 / month for 7 consecutive months'],
]

// Cash balance in $k across 19 months.
const CASH = [50, 47, 44, 46, 50, 55, 61, 68, 74, 48, 44, 63, 52, 41, 31, 22, 14, 7, 2, 0]
const MARKS = [
  { i: 9, label: 'Opened 2nd location' },
  { i: 10, label: 'Hired 4 trainers' },
  { i: 11, label: 'Took $25k loan' },
]

function CashChart({ play }) {
  const W = 560
  const H = 200
  const max = 90
  const x = (i) => (i / (CASH.length - 1)) * W
  const y = (v) => H - (v / max) * H
  const d = CASH.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
  return (
    <svg viewBox={`-8 -8 ${W + 16} ${H + 16}`} className="h-full w-full overflow-visible" aria-hidden="true">
      <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-neg)" strokeOpacity="0.5" strokeDasharray="4 4" />
      <text x={W} y={H - 6} textAnchor="end" className="fill-neg font-mono text-[10px]">
        $0
      </text>
      <path
        d={d}
        fill="none"
        stroke="var(--color-fg)"
        strokeWidth="1.75"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={play ? 0 : 1}
        style={{ transition: play ? 'stroke-dashoffset 2.6s cubic-bezier(.5,0,.3,1)' : 'none' }}
      />
      {MARKS.map((m, k) => (
        <g
          key={m.i}
          style={{ opacity: play ? 1 : 0, transition: `opacity .4s ${0.9 + k * 0.35}s` }}
        >
          {/* Later marks sit on higher rows so leader lines never cross a label. */}
          <line x1={x(m.i)} x2={x(m.i)} y1={y(CASH[m.i])} y2={4 + (MARKS.length - 1 - k) * 15} stroke="var(--color-line-2)" />
          <circle cx={x(m.i)} cy={y(CASH[m.i])} r="3.5" fill="var(--color-gold)" />
          <text x={x(m.i) - 6} y={8 + (MARKS.length - 1 - k) * 15} textAnchor="end" className="hidden fill-dim font-mono text-[10px] sm:block">
            {m.label}
          </text>
        </g>
      ))}
      <circle
        cx={x(CASH.length - 1)}
        cy={y(0)}
        r="5"
        fill="var(--color-neg)"
        style={{ opacity: play ? 1 : 0, transition: 'opacity .3s 2.5s' }}
      />
    </svg>
  )
}

export default function Failure() {
  const [ref, inView] = useInView({ threshold: 0.35 })
  const [run, setRun] = useState(1)
  const [replaying, setReplaying] = useState(false)

  const tryAgain = () => {
    setRun((r) => r + 1)
    setReplaying(true)
    setTimeout(() => setReplaying(false), 80)
  }

  const play = inView && !replaying

  return (
    <section id="failure" aria-labelledby="fail-title" className="relative overflow-hidden border-t border-neg/20 bg-[#0c0909] py-24 sm:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgb(240_87_92/0.12),transparent)]"
      />
      <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-neg">04</span>
          <span className="h-px w-8 bg-neg/40" aria-hidden="true" />
          <span className="eyebrow">Consequences</span>
        </Reveal>
        <Reveal as="h2" id="fail-title" delay={80} className="display mt-6 text-[clamp(4rem,14vw,11rem)] leading-[0.85]">
          You will <span className="text-neg">fail.</span>
        </Reveal>
        <Reveal as="p" delay={160} className="mt-6 text-2xl font-medium tracking-tight text-dim sm:text-3xl">
          And that’s the point.
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal className="space-y-4 text-lg leading-relaxed text-dim">
              <p>
                A simulation that protects you from bad decisions teaches you nothing. VentureSim doesn’t rescue you, doesn’t
                give hints mid-crisis, and doesn’t let you undo.
              </p>
              <p className="text-fg">Here, you are allowed to:</p>
            </Reveal>
            <ul className="mt-6 border-t border-neg/15">
              {MISTAKES.map((m, i) => (
                <Reveal
                  as="li"
                  key={m}
                  delay={i * 60}
                  className="group flex items-center justify-between border-b border-neg/15 py-3.5"
                >
                  <span className="text-[17px] font-medium transition-transform duration-300 group-hover:translate-x-1.5">{m}</span>
                  <span className="font-mono text-[10px] text-mute transition-colors group-hover:text-neg">
                    ERR_{String(i + 1).padStart(2, '0')}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal delay={150} className="lg:col-span-7">
            <div ref={ref} className="border border-neg/30 bg-ink shadow-[0_0_80px_-20px_rgb(240_87_92/0.25)]">
              <div className="flex items-center justify-between border-b border-neg/20 px-5 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                  Halcyon Fitness · Run #{String(run).padStart(3, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Month 19</span>
              </div>

              <div className="grid grid-cols-2 gap-px border-b border-neg/20 bg-neg/15 sm:grid-cols-4">
                {[
                  ['Revenue', '$84,200', ''],
                  ['Expenses', '$101,400', ''],
                  ['Cash', '$0', 'text-neg'],
                ].map(([k, v, c]) => (
                  <div key={k} className="bg-ink px-5 py-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{k}</div>
                    <div className={cx('tnum mt-1.5 font-mono text-xl', c)}>{v}</div>
                  </div>
                ))}
                <div className="bg-ink px-5 py-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Status</div>
                  <div
                    className={cx(
                      'mt-2 inline-flex items-center gap-1.5 whitespace-nowrap bg-neg px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink transition-opacity duration-300',
                      play ? 'opacity-100 delay-[2600ms]' : 'opacity-0',
                    )}
                  >
                    <Skull className="size-3.5" aria-hidden="true" />
                    Business failed
                  </div>
                </div>
              </div>

              <div className="px-5 pt-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Cash balance · 19 months</div>
                <div className="mt-4 h-44 sm:h-52">
                  <CashChart play={play} />
                </div>
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[10px] text-dim sm:hidden">
                  {MARKS.map((m) => (
                    <li key={m.i} className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                      M{m.i} · {m.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 border-t border-neg/20 p-5 sm:p-6">
                <div className="display text-3xl">Why?</div>
                <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                  {WHY.map(([t, detail], i) => (
                    <li key={t} className="flex gap-3">
                      <span className="font-mono text-xs text-neg">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <span className="block text-[15px] font-medium leading-snug">{t}</span>
                        <span className="tnum mt-1 block font-mono text-[11px] text-mute">{detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-7 flex flex-col items-start gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-dim">Same market. Same $50,000. Different decisions.</p>
                  <button
                    type="button"
                    onClick={tryAgain}
                    className="group inline-flex h-11 items-center gap-2.5 border border-fg px-5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-fg transition-colors hover:bg-fg hover:text-ink"
                  >
                    <RotateCcw className="size-4 transition-transform duration-500 group-hover:-rotate-180" aria-hidden="true" />
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
