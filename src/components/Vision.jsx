import { Reveal, SectionHeader } from './ui'

const AUDIENCES = [
  ['Students', 'Learn without risking real money — and graduate having already run a business.'],
  ['Aspiring entrepreneurs', 'Test an idea’s economics before quitting a job or signing a lease.'],
  ['Business owners', 'Rehearse a price change, a hire, or an expansion before betting the company on it.'],
  ['Teachers', 'Run a whole classroom in one shared market and debrief with real data.'],
  ['Creators', 'Design custom scenarios and businesses for others to play and learn from.'],
]

export default function Vision() {
  return (
    <section id="about" aria-labelledby="vision-title" className="relative border-t border-line bg-ink-2 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHeader index="08" label="Why we’re building this" title={<span id="vision-title">What if business education felt like a game?</span>}>
            Pilots train in flight simulators before they fly. Surgeons practice before they operate. But most people
            learn business by risking their savings on their first attempt.
          </SectionHeader>
          <Reveal delay={240} className="mt-8 space-y-4 text-lg leading-relaxed text-dim">
            <p>
              We’re building a world where anyone can safely experiment with entrepreneurship — where your first failed
              business costs you an afternoon, not your savings.
            </p>
            <p className="text-fg">Not a replacement for the real thing. Practice for it.</p>
          </Reveal>
        </div>

        <ul className="border-t border-line lg:col-span-6 lg:mt-20">
          {AUDIENCES.map(([who, what], i) => (
            <Reveal
              as="li"
              key={who}
              delay={i * 70}
              className="group grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-line py-6 transition-colors sm:grid-cols-[3rem_14rem_1fr]"
            >
              <span className="font-mono text-xs text-mute transition-colors group-hover:text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-lg font-semibold tracking-tight">{who}</span>
              <span className="col-start-2 mt-1 text-sm leading-relaxed text-dim sm:col-start-3 sm:mt-0.5">{what}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
