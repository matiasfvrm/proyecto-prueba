import { BookOpen, Check, X } from 'lucide-react'
import { Reveal, SectionHeader } from './ui'

const STEPS = [
  { title: 'Choose a business', body: 'Pick a model, a city, and a starting budget. A food truck with $15k. A SaaS with $80k.' },
  { title: 'Make decisions', body: 'Pricing, hiring, marketing, suppliers, loans. Nobody tells you the right answer.' },
  { title: 'Manage resources', body: 'Cash, time, people, inventory. Everything is limited — and everything competes.' },
  { title: 'Face consequences', body: 'Every choice ripples through demand, margins, morale, and cash flow — sometimes months later.' },
  { title: 'Grow or fail', body: 'Scale to new locations, stall on a plateau, or run out of cash. All three are possible.' },
  { title: 'Learn why', body: 'A full post-mortem traces every outcome back to the decisions that caused it.' },
]

const OLD = ['Pricing in week 3', 'Cash flow in week 5', 'Hiring in week 8', 'Each concept in isolation']
const NEW = ['Every concept, at the same time', 'Connected like a real business', 'Consequences you can see', 'Mistakes that cost nothing']

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="relative border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeader index="01" label="The idea" title={<span id="hiw-title">Stop learning business. Start running one.</span>}>
              Traditional business education teaches concepts one at a time — pricing in one chapter, cash flow in
              another, hiring in a third. Real businesses don’t work like that. In VentureSim, every concept lives in the
              same system, so you see how one decision pulls on everything else.
            </SectionHeader>
          </div>

          <Reveal delay={200} className="grid self-end border border-line sm:grid-cols-2 lg:col-span-5">
            <div className="p-6">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                <BookOpen className="size-3.5" aria-hidden="true" /> A course
              </div>
              <ul className="mt-5 space-y-3">
                {OLD.map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-mute">
                    <X className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-line bg-panel p-6 sm:border-l sm:border-t-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">A simulation</div>
              <ul className="mt-5 space-y-3">
                {NEW.map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-fg">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden="true" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Flow */}
        <ol className="relative mt-20 grid border-l border-line md:grid-cols-3 md:border-l-0 xl:grid-cols-6">
          {STEPS.map((s, i) => (
            <Reveal
              as="li"
              key={s.title}
              delay={i * 90}
              className="group relative py-8 pl-8 pr-4 md:border-l md:border-t md:border-line md:pl-6 md:first:border-l-0 md:[&:nth-child(4)]:border-l-0 xl:[&:nth-child(4)]:border-l"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[5px] top-9 size-[9px] border border-line-2 bg-ink transition-colors duration-300 group-hover:border-gold group-hover:bg-gold md:-top-[5px] md:left-6"
              />
              <div className="font-mono text-[11px] text-gold">STEP {String(i + 1).padStart(2, '0')}</div>
              <h3 className="mt-3 text-lg font-semibold uppercase tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dim">{s.body}</p>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="mt-4 block font-mono text-mute md:hidden">
                  ↓
                </span>
              )}
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-16 border-l-2 border-gold pl-6">
          <p className="max-w-3xl text-2xl font-medium leading-snug tracking-tight text-balance sm:text-3xl">
            You don’t learn business by memorizing definitions.{' '}
            <span className="text-dim">You learn by making decisions and seeing what happens.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
