# VentureSim — Landing Page

Marketing site for **VentureSim**, a business simulation laboratory: learn business by actually running one.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Lucide icons
- Geist / Geist Mono (Google Fonts)

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build
```

## Structure

```
src/
  App.jsx                 page composition
  index.css               design tokens (@theme), base styles, animations
  lib.js                  number/currency formatting helpers
  hooks/useInView.js      scroll reveal + reduced-motion hooks
  components/
    ui.jsx                Button, Reveal, SectionHeader, LiveDot
    Navbar.jsx            fixed nav + mobile menu
    Hero.jsx              hook, CTAs, live dashboard
    SimDashboard.jsx      interactive simulation mockup (ticking metrics, decision events)
    HowItWorks.jsx        "Stop learning business" + 6-step flow
    Businesses.jsx        sector / scenario selector
    Decisions.jsx         pricing slider with before/after projection
    Failure.jsx           "You will fail" + failed-business post-mortem
    Advisor.jsx           AI advisor conversation prototype
    Market.jsx            market feed ticker + market events
    Modes.jsx             game mode selector
    Vision.jsx            long-term vision / audiences
    FinalCta.jsx          closing CTA with signup + footer
```

All interactive pieces are frontend prototypes — no backend required. Animations respect `prefers-reduced-motion`.
