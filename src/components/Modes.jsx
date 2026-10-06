import { useState } from 'react'
import { ArrowRight, FlaskConical, Globe, GraduationCap, Swords, Target } from 'lucide-react'
import { Reveal, SectionHeader } from './ui'
import { cx } from '../lib'

const MODES = [
  {
    name: 'Learn',
    sample: ['Lesson 4 · Your first price increase', 'Completion', '92%'],
    icon: GraduationCap,
    line: 'Guided simulations that teach business fundamentals.',
    detail: 'Short, focused scenarios — pricing a product, surviving a slow quarter, making a first hire. The advisor debriefs you after each one.',
    meta: [['Length', '20–40 min'], ['Difficulty', 'Beginner'], ['Guidance', 'Full']],
  },
  {
    name: 'Sandbox',
    sample: ['Custom · Food truck in Austin, $15,000', 'Timelines forked', '3'],
    icon: FlaskConical,
    line: 'Build a business with freedom and experiment.',
    detail: 'Pick any business, any city, any budget. Pause, fork timelines, and test “what if” scenarios side by side.',
    meta: [['Length', 'Open-ended'], ['Difficulty', 'You decide'], ['Guidance', 'On demand']],
  },
  {
    name: 'Challenge',
    sample: ['Recession Launch · survive 24 months', 'Survival rate', '11%'],
    icon: Target,
    line: 'Start with difficult conditions and try to survive.',
    detail: 'Recession launches. $4,000 and a lease. A supplier that just doubled prices. Hand-built crises with a global leaderboard.',
    meta: [['Length', '1–3 hours'], ['Difficulty', 'Hard'], ['Guidance', 'None']],
  },
  {
    name: 'Competition',
    sample: ['League S1 · Coffee Wars · 12 players', 'Your rank', '#4'],
    icon: Swords,
    line: 'Compete against other players.',
    detail: 'Up to 12 players share one market. Your pricing moves their demand. Seasonal ranked leagues and private classroom lobbies.',
    meta: [['Length', '2–4 weeks'], ['Players', '2–12'], ['Guidance', 'None']],
  },
  {
    name: 'Real World',
    sample: ['Same café · Lisbon vs. Zurich', 'Margin gap', '14 pts'],
    icon: Globe,
    line: 'Simulate businesses under different countries and market conditions.',
    detail: 'Local wages, taxes, rents, interest rates, and consumer behavior. See why the same café thrives in Lisbon and struggles in Zurich.',
    meta: [['Markets', '40+ countries'], ['Data', 'Calibrated'], ['Guidance', 'Optional']],
  },
]

export default function Modes() {
  const [active, setActive] = useState(2)
  const m = MODES[active]

  return (
    <section id="challenges" aria-labelledby="modes-title" className="relative border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader index="07" label="Game modes" title={<span id="modes-title">Choose how you want to play.</span>}>
          Learn the fundamentals, experiment freely, survive brutal conditions, or go head-to-head with other founders.
        </SectionHeader>

        <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-12">
          <ul className="bg-ink lg:col-span-7" role="list">
            {MODES.map((mode, i) => {
              const on = i === active
              return (
                <li key={mode.name} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-pressed={on}
                    className={cx(
                      'group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 px-5 py-6 text-left transition-colors duration-300 sm:gap-8 sm:px-7',
                      on ? 'bg-panel' : 'hover:bg-panel/60',
                    )}
                  >
                    <span aria-hidden="true" className={cx('absolute inset-y-0 left-0 w-0.5 bg-gold transition-opacity', on ? 'opacity-100' : 'opacity-0')} />
                    <span className={cx('font-mono text-xs', on ? 'text-gold' : 'text-mute')}>{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className={cx('display block text-3xl transition-colors sm:text-5xl', on ? 'text-fg' : 'text-mute group-hover:text-dim')}>
                        {mode.name}
                      </span>
                      <span className={cx('mt-2 block text-sm transition-colors', on ? 'text-dim' : 'text-mute')}>{mode.line}</span>
                    </span>
                    <ArrowRight
                      className={cx('size-5 transition-all duration-300', on ? 'translate-x-0 text-gold' : '-translate-x-2 text-mute opacity-0 group-hover:opacity-100')}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="relative flex flex-col overflow-hidden bg-panel lg:col-span-5" aria-live="polite">
            <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-60" />
            <div key={m.name} className="relative flex flex-1 flex-col p-7 animate-[fade_.35s_ease] sm:p-9">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">Mode {String(active + 1).padStart(2, '0')} / 05</span>
                <m.icon className="size-6 text-gold" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="display mt-10 text-5xl sm:text-6xl">{m.name}</h3>
              <p className="mt-5 text-[15px] leading-relaxed text-dim">{m.detail}</p>
              <div className="mt-8 flex items-center justify-between gap-4 border border-line-2 bg-ink/60 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Example</div>
                  <div className="mt-1 text-sm leading-snug">{m.sample[0]}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{m.sample[1]}</div>
                  <div className="tnum mt-1 font-mono text-lg text-gold">{m.sample[2]}</div>
                </div>
              </div>
              <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6 lg:mt-auto">
                {m.meta.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{k}</dt>
                    <dd className="mt-1 text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <a
                href="#start"
                className="group mt-6 inline-flex items-center gap-2 self-start font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-fg"
              >
                <span className="border-b border-gold pb-0.5">Play {m.name}</span>
                <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
