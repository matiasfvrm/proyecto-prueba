import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Businesses from './components/Businesses'
import Decisions from './components/Decisions'
import Failure from './components/Failure'
import Advisor from './components/Advisor'
import Market from './components/Market'
import Modes from './components/Modes'
import Vision from './components/Vision'
import FinalCta, { Footer } from './components/FinalCta'

export default function App() {
  return (
    <div id="top" className="overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Businesses />
        <Decisions />
        <Failure />
        <Advisor />
        <Market />
        <Modes />
        <Vision />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
