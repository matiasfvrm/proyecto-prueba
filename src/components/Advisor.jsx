import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Send, Sparkles } from 'lucide-react'
import { Reveal, SectionHeader } from './ui'
import { useInView, usePrefersReducedMotion } from '../hooks/useInView'
import { cx } from '../lib'

const THREADS = [
  {
    q: 'Why are my profits falling?',
    reads: ['P&L · 6 months', 'Acquisition funnel', 'Customer cohorts'],
    a: 'Revenue is still growing, but your customer acquisition cost increased 41% while your average customer value remained flat. Your marketing spend is currently reducing profitability.',
    evidence: [
      { k: 'CAC', from: '$38.00', to: '$53.60', delta: '+41%', bad: true },
      { k: 'Avg. customer value', from: '$112', to: '$112', delta: '0%', bad: null },
      { k: 'Paid ads share of spend', from: '22%', to: '34%', delta: '+12 pts', bad: true },
    ],
    actions: ['Simulate: cut paid ads 30%', 'Show CAC by channel'],
  },
  {
    q: 'Should I open a second location?',
    reads: ['Cash position', 'Operating expenses', 'Location #1 performance'],
    a: 'Not yet. Your first location has strong revenue but your cash reserves only cover approximately 2.4 months of operating expenses.',
    evidence: [
      { k: 'Cash runway', from: '', to: '2.4 mo', delta: 'Target 6+', bad: true },
      { k: 'Location #1 revenue', from: '', to: '$18,430', delta: 'Top 15%', bad: false },
      { k: 'Est. build-out cost', from: '', to: '$62,000', delta: '130% of cash', bad: true },
    ],
    actions: ['Model a second location anyway', 'What runway do I need?'],
  },
]

function useTypewriter(text, active, speed = 14) {
  const reduced = usePrefersReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) return setN(0)
    if (reduced) return setN(text.length)
    setN(0)
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id)
          return v
        }
        return v + 2
      })
    }, speed)
    return () => clearInterval(id)
  }, [text, active, reduced, speed])
  return [text.slice(0, n), n >= text.length]
}

export default function Advisor() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('idle') // idle → reading → answering
  const timers = useRef([])
  const t = THREADS[idx]
  const [typed, done] = useTypewriter(t.a, phase === 'answering')

  const ask = (i) => {
    timers.current.forEach(clearTimeout)
    setIdx(i)
    setPhase('reading')
    timers.current = [setTimeout(() => setPhase('answering'), 1400)]
  }

  useEffect(() => {
    if (inView && phase === 'idle') ask(0)
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return (
    <section aria-labelledby="ai-title" className="relative border-t border-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader index="05" label="AI Advisor" title={<span id="ai-title">Your business has an AI advisor.</span>}>
            Ask anything about your simulated company. The advisor reads your actual numbers — every transaction, hire,
            and campaign — and explains what is happening and why.
          </SectionHeader>
          <Reveal delay={240} as="ul" className="mt-10 space-y-4 border-t border-line pt-8">
            {[
              ['Grounded in your data', 'It answers from your simulation’s ledger, not generic advice.'],
              ['Explains, doesn’t decide', 'It shows trade-offs. The decision stays yours.'],
              ['Tests before you commit', 'Run a “what if” as a forked scenario, then compare.'],
            ].map(([h, b]) => (
              <li key={h} className="grid grid-cols-[auto_1fr] gap-x-4">
                <span className="mt-2 size-1.5 bg-gold" aria-hidden="true" />
                <span>
                  <span className="block font-medium">{h}</span>
                  <span className="block text-sm text-dim">{b}</span>
                </span>
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal delay={120} className="lg:col-span-7">
          <div ref={ref} className="grid border border-line-2 bg-ink-2 md:grid-cols-[180px_1fr]">
            {/* Sidebar — shows the advisor lives inside the simulation */}
            <aside className="hidden border-r border-line md:block" aria-label="Simulation navigation">
              <div className="border-b border-line px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Nova Coffee</div>
              <ul className="py-2 text-[13px]">
                {['Overview', 'Finances', 'Customers', 'Team', 'Marketing', 'Market'].map((x) => (
                  <li key={x} className="px-4 py-2 text-mute">
                    {x}
                  </li>
                ))}
                <li className="flex items-center gap-2 border-l-2 border-gold bg-white/[0.03] px-[14px] py-2 text-fg">
                  <Sparkles className="size-3.5 text-gold" aria-hidden="true" /> Advisor
                </li>
              </ul>
              <div className="mx-4 mt-4 border-t border-line pt-4 font-mono text-[10px] leading-relaxed text-mute">
                Context loaded
                <br />
                <span className="text-dim">14 months · 2,318 events</span>
              </div>
            </aside>

            <div className="flex min-h-[520px] flex-col">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
                  <Sparkles className="size-3.5" aria-hidden="true" /> Advisor
                </span>
                <span className="font-mono text-[10px] text-mute">Month 14 · Day 12</span>
              </div>

              <div className="flex-1 space-y-5 p-5" aria-live="polite">
                {phase !== 'idle' && (
                  <div key={'q' + idx} className="flex justify-end animate-[fade_.3s_ease]">
                    <div className="max-w-[85%]">
                      <div className="mb-1.5 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-mute">You</div>
                      <p className="bg-panel-2 px-4 py-2.5 text-[15px]">{t.q}</p>
                    </div>
                  </div>
                )}

                {phase === 'reading' && (
                  <div className="animate-[fade_.3s_ease] space-y-1.5 font-mono text-[11px] text-dim">
                    {t.reads.map((r, i) => (
                      <div key={r} className="flex items-center gap-2 opacity-0 animate-[fade_.3s_ease_forwards]" style={{ animationDelay: `${i * 300}ms` }}>
                        <span className="text-gold">›</span> Reading {r}
                      </div>
                    ))}
                  </div>
                )}

                {phase === 'answering' && (
                  <div key={'a' + idx} className="animate-[fade_.3s_ease]">
                    <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
                      Advisor <span className="text-mute normal-case tracking-normal">· based on {t.reads.join(', ')}</span>
                    </div>
                    <p className="border-l-2 border-gold pl-4 text-[15px] leading-relaxed">
                      {typed}
                      {!done && <span className="ml-0.5 inline-block h-4 w-[7px] translate-y-0.5 bg-gold animate-blink" aria-hidden="true" />}
                    </p>

                    <div className={cx('mt-5 transition-opacity duration-500', done ? 'opacity-100' : 'opacity-0')}>
                      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
                        {t.evidence.map((e) => (
                          <div key={e.k} className="bg-panel px-3.5 py-3">
                            <div className="truncate text-[11px] text-mute">{e.k}</div>
                            <div className="tnum mt-1 font-mono text-base">{e.to}</div>
                            <div className="tnum mt-0.5 font-mono text-[10px]">
                              <span className={e.bad === null ? 'text-mute' : e.bad ? 'text-neg' : 'text-pos'}>{e.delta}</span>
                              {e.from && <span className="text-mute"> · was {e.from}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {t.actions.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1.5 border border-line-2 px-2.5 py-1.5 font-mono text-[11px] text-dim">
                            {a} <ArrowUpRight className="size-3" aria-hidden="true" />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-line p-4">
                <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Example questions">
                  {THREADS.map((th, i) => (
                    <button
                      key={th.q}
                      type="button"
                      onClick={() => ask(i)}
                      aria-pressed={idx === i && phase !== 'idle'}
                      className={cx(
                        'border px-3 py-1.5 text-left text-[13px] transition-colors',
                        idx === i ? 'border-gold/60 text-fg' : 'border-line-2 text-dim hover:border-fg/40 hover:text-fg',
                      )}
                    >
                      {th.q}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 border border-line-2 bg-ink px-4 py-3">
                  <span className="flex-1 truncate text-sm text-mute">Ask about your business…</span>
                  <Send className="size-4 text-mute" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
