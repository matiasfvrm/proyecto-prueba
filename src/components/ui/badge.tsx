import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/domain/labels";
import {
  CLAIM_KIND_META,
  CONTRIBUTION_STATUS_META,
  EVIDENCE_STATUS_META,
  TASK_STATUS_META,
} from "@/lib/domain/labels";
import type { ClaimKind, ContributionStatus, EvidenceStatus, TaskStatus } from "@/lib/domain/types";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong bg-surface-2 text-fg-muted",
  accent: "border-accent/30 bg-accent-soft text-accent",
  info: "border-[#8f9cf5]/30 bg-[#8f9cf5]/10 text-[#b3bcf8]",
  warn: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  muted: "border-line bg-transparent text-fg-subtle",
  danger: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};
const dots: Record<Tone, string> = {
  neutral: "bg-fg-muted",
  accent: "bg-accent",
  info: "bg-[#8f9cf5]",
  warn: "bg-amber-400",
  success: "bg-emerald-400",
  muted: "bg-fg-subtle",
  danger: "bg-rose-400",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  title,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-4 whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function EvidenceBadge({ status, className }: { status: EvidenceStatus; className?: string }) {
  const m = EVIDENCE_STATUS_META[status];
  return (
    <Badge tone={m.tone} dot title={m.description} className={className}>
      {m.label}
    </Badge>
  );
}

export function TaskBadge({ status }: { status: TaskStatus }) {
  const m = TASK_STATUS_META[status];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export function ContributionBadge({ status }: { status: ContributionStatus }) {
  const m = CONTRIBUTION_STATUS_META[status];
  return (
    <Badge tone={m.tone} dot title={m.description}>
      {m.label}
    </Badge>
  );
}

export function ClaimBadge({ kind }: { kind: ClaimKind }) {
  const m = CLAIM_KIND_META[kind];
  return (
    <Badge tone={m.tone} title={m.description}>
      {m.label}
    </Badge>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge tone="muted" className={cn("uppercase tracking-wider text-[10px]", className)} title="Fictional, illustrative content">
      Demo
    </Badge>
  );
}

export function SkillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11.5px] text-fg-muted">
      {children}
    </span>
  );
}
