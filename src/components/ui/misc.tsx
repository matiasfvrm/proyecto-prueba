import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[11.5px] uppercase tracking-[0.14em] text-accent", className)}>{children}</p>;
}

export function Panel({ className, children, as: As = "div", ...rest }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "article" | "aside" | "li" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={cn("rounded-lg border border-line bg-surface", className)} {...rest}>
      {children}
    </As>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-12 text-center", className)}>
      <Icon className="size-6 text-fg-subtle" aria-hidden />
      <p className="mt-3 text-sm font-medium text-fg">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-fg-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-3 font-medium text-fg-muted", className)}
    >
      {initials}
    </span>
  );
}

export function SectionTitle({ id, children, count, action }: { id?: string; children: React.ReactNode; count?: number; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-[15px] font-semibold text-fg">
        {children}
        {count !== undefined && <span className="rounded bg-surface-3 px-1.5 text-xs font-normal tabular-nums text-fg-muted">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {description && <div className="mt-2 text-pretty text-[15px] leading-relaxed text-fg-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
