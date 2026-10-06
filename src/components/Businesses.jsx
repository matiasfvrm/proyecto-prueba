import { useState } from 'react'
import { Building2, Clapperboard, Cpu, Factory, Hammer, ShoppingBag, Store, UtensilsCrossed, Video, Briefcase } from 'lucide-react'
import { Button, Reveal, SectionHeader } from './ui'
import { cx, usd } from '../lib'

const CATEGORIES = [
  {
    id: 'tech',
    name: 'Tech',
    icon: Cpu,
    examples: 'SaaS, Apps, AI Startups',
    businesses: [
      { name: 'B2B SaaS', cash: 80000, difficulty: 4, tension: 'Burn rate vs. growth. Churn quietly erases your MRR.', vars: ['MRR', 'Churn', 'CAC', 'Runway'] },
      { name: 'Mobile App', cash: 40000, difficulty: 3, tension: 'Downloads are easy. Retention and monetization are not.', vars: ['DAU', 'Retention', 'ARPU', 'Ad spend'] },
      { name: 'AI Startup', cash: 150000, difficulty: 5, tension: 'Compute costs scale with every user you win.', vars: ['Compute', 'Margins', 'Funding', 'Hiring'] },
    ],
  },
  {
    id: 'commerce',
    name: 'Commerce',
    icon: ShoppingBag,
    examples: 'E-commerce, Retail, Clothing',
    businesses: [
      { name: 'E-commerce Store', cash: 25000, difficulty: 3, tension: 'Ad costs rise every quarter. Your margins don’t.', vars: ['ROAS', 'AOV', 'Inventory', 'Returns'] },
      { name: 'Clothing Brand', cash: 35000, difficulty: 4, tension: 'Order too much and cash sits in a warehouse. Too little and you sell out.', vars: ['Inventory', 'Brand', 'Seasonality', 'Margins'] },
      { name: 'Retail Shop', cash: 60000, difficulty: 3, tension: 'Rent is fixed. Foot traffic is not.', vars: ['Foot traffic', 'Rent', 'Stock', 'Staff'] },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    icon: Briefcase,
    examples: 'Agency, Consulting, Freelancing',
    businesses: [
      { name: 'Marketing Agency', cash: 20000, difficulty: 3, tension: 'One big client pays the bills — until they leave.', vars: ['Utilization', 'Retainers', 'Payroll', 'Pipeline'] },
      { name: 'Consulting Firm', cash: 15000, difficulty: 2, tension: 'You are the product. Scaling means selling your time — or not.', vars: ['Day rate', 'Pipeline', 'Reputation', 'Capacity'] },
      { name: 'Freelancer', cash: 5000, difficulty: 1, tension: 'Feast or famine. Learn to price before you burn out.', vars: ['Hourly rate', 'Clients', 'Hours', 'Savings'] },
    ],
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    icon: UtensilsCrossed,
    examples: 'Restaurants, Hotels, Cafés',
    businesses: [
      { name: 'Restaurant', cash: 120000, difficulty: 5, tension: 'Thin margins, perishable stock, and a lease you can’t escape.', vars: ['Food cost', 'Covers', 'Staff', 'Reviews'] },
      { name: 'Boutique Hotel', cash: 400000, difficulty: 5, tension: 'Empty rooms cost the same as full ones.', vars: ['Occupancy', 'ADR', 'Debt', 'Seasonality'] },
      { name: 'Café', cash: 55000, difficulty: 3, tension: 'Location decides everything. Rent decides if you survive it.', vars: ['Foot traffic', 'Avg. ticket', 'Rent', 'Loyalty'] },
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    icon: Video,
    examples: 'YouTube, Content, Personal Brand',
    businesses: [
      { name: 'YouTube Channel', cash: 3000, difficulty: 2, tension: 'The algorithm changes. Your audience is all you own.', vars: ['Views', 'CPM', 'Sponsors', 'Output'] },
      { name: 'Newsletter', cash: 2000, difficulty: 2, tension: 'Free readers are easy. Paid subscribers are a business.', vars: ['Subscribers', 'Conversion', 'Churn', 'Ads'] },
      { name: 'Personal Brand', cash: 5000, difficulty: 3, tension: 'Turn attention into products before attention moves on.', vars: ['Audience', 'Products', 'Trust', 'Time'] },
    ],
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    icon: Building2,
    examples: 'Rental, Property Development',
    businesses: [
      { name: 'Rental Portfolio', cash: 90000, difficulty: 3, tension: 'Leverage multiplies returns — and interest rates multiply risk.', vars: ['Occupancy', 'Debt', 'Rates', 'Repairs'] },
      { name: 'Property Developer', cash: 250000, difficulty: 5, tension: 'Two years of costs before a single sale.', vars: ['Permits', 'Construction', 'Loans', 'Pre-sales'] },
      { name: 'Short-term Rentals', cash: 40000, difficulty: 3, tension: 'High yields, high volatility, and regulations that change overnight.', vars: ['Occupancy', 'Nightly rate', 'Reviews', 'Rules'] },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: Clapperboard,
    examples: 'Game Studio, Media',
    businesses: [
      { name: 'Indie Game Studio', cash: 70000, difficulty: 4, tension: 'Eighteen months of payroll for one launch weekend.', vars: ['Dev time', 'Wishlists', 'Payroll', 'Reviews'] },
      { name: 'Media Company', cash: 50000, difficulty: 4, tension: 'Audience growth is costly. Advertisers want guarantees.', vars: ['Audience', 'Ad sales', 'Content', 'Staff'] },
      { name: 'Live Events', cash: 30000, difficulty: 4, tension: 'You pay for the venue months before you sell a ticket.', vars: ['Tickets', 'Venue', 'Sponsors', 'Weather'] },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: Factory,
    examples: 'Factories, Products',
    businesses: [
      { name: 'Small Factory', cash: 300000, difficulty: 5, tension: 'Idle machines still depreciate. Full machines still break.', vars: ['Capacity', 'Suppliers', 'Defects', 'Orders'] },
      { name: 'Consumer Product', cash: 60000, difficulty: 4, tension: 'Minimum order quantities lock up your cash for months.', vars: ['MOQ', 'Unit cost', 'Retailers', 'Inventory'] },
      { name: 'Construction Co.', cash: 120000, difficulty: 4, tension: 'Fixed-price bids meet rising material costs.', vars: ['Bids', 'Materials', 'Crews', 'Delays'] },
    ],
  },
]

function DifficultyBars({ value }) {
  return (
    <span className="flex items-center gap-[3px]" aria-label={`Difficulty ${value} of 5`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cx('h-2.5 w-1.5', i <= value ? 'bg-gold' : 'bg-line-2')} />
      ))}
    </span>
  )
}

export default function Businesses() {
  const [active, setActive] = useState(3)
  const [pick, setPick] = useState(2)
  const cat = CATEGORIES[active]
  const biz = cat.businesses[pick]

  const select = (i) => {
    setActive(i)
    setPick(0)
  }

  return (
    <section id="businesses" aria-labelledby="biz-title" className="relative border-t border-line bg-ink-2 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeader index="02" label="Choose your business" title={<span id="biz-title">One simulation. Hundreds of businesses.</span>}>
            Every industry runs on different economics. A café lives on foot traffic. A SaaS lives on churn. A factory
            lives on capacity. Pick one and learn its rules the hard way.
          </SectionHeader>
          <Reveal delay={200} className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute lg:text-right">
            8 sectors · 200+ business types
            <br />
            New models added monthly
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-12">
          {/* Category select */}
          <div className="flex flex-col bg-ink-2 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Select sector</span>
              <span className="font-mono text-[10px] text-mute">{String(active + 1).padStart(2, '0')} / 08</span>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-px bg-line sm:grid-cols-4 sm:grid-rows-2" role="group" aria-label="Business sectors">
              {CATEGORIES.map((c, i) => {
                const Icon = c.icon
                const on = i === active
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => select(i)}
                    aria-pressed={on}
                    className={cx(
                      'group relative flex min-h-40 flex-col justify-between overflow-hidden p-5 text-left transition-colors duration-300',
                      on ? 'bg-panel-2' : 'bg-ink-2 hover:bg-panel',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        'absolute inset-x-0 top-0 h-0.5 origin-left bg-gold transition-transform duration-300',
                        on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50',
                      )}
                    />
                    <div className="flex items-start justify-between">
                      <Icon
                        className={cx('size-5 transition-all duration-300', on ? 'text-gold' : 'text-dim group-hover:-translate-y-0.5 group-hover:text-fg')}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-[10px] text-mute">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold uppercase tracking-tight">{c.name}</div>
                      <div className="mt-1 min-h-[2lh] text-xs leading-snug text-mute">{c.examples}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Loadout */}
          <div className="flex flex-col bg-panel lg:col-span-5" aria-live="polite">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">{cat.name} · Scenarios</span>
              <cat.icon className="size-4 text-mute" aria-hidden="true" />
            </div>
            <ul className="divide-y divide-line border-b border-line" role="list">
              {cat.businesses.map((b, i) => (
                <li key={b.name}>
                  <button
                    type="button"
                    onClick={() => setPick(i)}
                    aria-pressed={i === pick}
                    className={cx(
                      'flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors',
                      i === pick ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cx('size-1.5 transition-colors', i === pick ? 'bg-gold' : 'bg-line-2')} aria-hidden="true" />
                      <span className={cx('text-sm font-medium', i === pick ? 'text-fg' : 'text-dim')}>{b.name}</span>
                    </span>
                    <DifficultyBars value={b.difficulty} />
                  </button>
                </li>
              ))}
            </ul>

            <div key={cat.id + pick} className="flex flex-1 flex-col p-5 animate-[fade_.35s_ease]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Starting cash</div>
                  <div className="tnum mt-1 font-mono text-2xl">{usd(biz.cash)}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Difficulty</div>
                  <div className="mt-2.5">
                    <DifficultyBars value={biz.difficulty} />
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Core tension</div>
                <p className="mt-1.5 text-[15px] leading-snug">{biz.tension}</p>
              </div>
              <div className="mt-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute">Key variables</div>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {biz.vars.map((v) => (
                    <li key={v} className="border border-line-2 px-2 py-1 font-mono text-[11px] text-dim">
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
              <Button href="#start" className="mt-6 w-full lg:mt-auto" arrow>
                Launch {biz.name}
              </Button>
            </div>
          </div>
        </div>

        <Reveal className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-mute">
          <span className="text-dim">Also playable:</span>
          {['Gym', 'Food Truck', 'Marketplace', 'Subscription Box', 'Hardware Store', 'Bakery', 'Dental Clinic'].map((x) => (
            <span key={x} className="flex items-center gap-2">
              <Store className="size-3" aria-hidden="true" />
              {x}
            </span>
          ))}
          <span className="flex items-center gap-2">
            <Hammer className="size-3" aria-hidden="true" />
            + build your own
          </span>
        </Reveal>
      </div>
    </section>
  )
}
