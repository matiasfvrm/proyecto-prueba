import { ArrowRight } from 'lucide-react'
import { useInView } from '../hooks/useInView'
import { cx } from '../lib'

export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...props }) {
  const [ref, inView] = useInView()
  return (
    <Tag
      ref={ref}
      className={cx('reveal', inView && 'is-in', className)}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  )
}

const base =
  'group relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-mono text-[12px] font-semibold uppercase tracking-[0.14em] transition-[background-color,color,border-color,transform,box-shadow] duration-200 active:translate-y-px disabled:pointer-events-none'

export function Button({ variant = 'primary', size = 'md', href, arrow, className, children, ...props }) {
  const sizes = {
    sm: 'h-9 px-4',
    md: 'h-12 px-6',
    lg: 'h-14 px-8 text-[13px]',
  }
  const variants = {
    primary:
      'bg-gold text-ink hover:bg-gold-hi shadow-[inset_0_-2px_0_rgb(0_0_0/0.25)] hover:shadow-[0_0_0_4px_rgb(232_176_75/0.15),inset_0_-2px_0_rgb(0_0_0/0.25)]',
    secondary: 'border border-line-2 text-fg hover:border-fg/60 hover:bg-white/[0.03]',
    ghost: 'text-dim hover:text-fg',
  }
  const Tag = href ? 'a' : 'button'
  return (
    <Tag
      href={href}
      className={cx(base, sizes[size], variants[variant], className)}
      {...(Tag === 'button' && { type: 'button' })}
      {...props}
    >
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
          strokeWidth={2.25}
        />
      )}
    </Tag>
  )
}

export function SectionHeader({ index, label, title, children, align = 'left', className }) {
  return (
    <div className={cx(align === 'center' && 'mx-auto text-center', 'max-w-3xl', className)}>
      <Reveal className={cx('flex items-center gap-3', align === 'center' && 'justify-center')}>
        <span className="font-mono text-[11px] text-gold">{index}</span>
        <span className="h-px w-8 bg-line-2" aria-hidden="true" />
        <span className="eyebrow">{label}</span>
      </Reveal>
      <Reveal as="h2" delay={80} className="display mt-6 text-[clamp(2.25rem,5.5vw,4.5rem)] text-balance">
        {title}
      </Reveal>
      {children && (
        <Reveal delay={160} className="mt-6 text-lg leading-relaxed text-dim text-pretty">
          {children}
        </Reveal>
      )}
    </div>
  )
}

/** Small live indicator dot. */
export function LiveDot({ className }) {
  return <span aria-hidden="true" className={cx('inline-block size-1.5 rounded-full bg-pos animate-pulse-dot', className)} />
}
