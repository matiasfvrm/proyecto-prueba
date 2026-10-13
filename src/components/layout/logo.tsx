import Link from "next/link";
import { cn } from "@/lib/utils";

/** Mark: three connected nodes resolving into one — many minds converging on a problem. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden fill="none">
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" className="fill-surface-3 stroke-line-strong" />
      <path d="M6.5 7.5 L12 16 L17.5 7.5" className="stroke-fg-subtle" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 7.5 L17.5 7.5" className="stroke-fg-subtle" strokeWidth="1.2" strokeDasharray="1.5 1.8" />
      <circle cx="6.5" cy="7.5" r="1.9" className="fill-fg" />
      <circle cx="17.5" cy="7.5" r="1.9" className="fill-fg" />
      <circle cx="12" cy="16" r="2.4" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-md", className)} aria-label="UNsolved home">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-fg">
        <span className="text-accent">UN</span>solved
      </span>
    </Link>
  );
}
