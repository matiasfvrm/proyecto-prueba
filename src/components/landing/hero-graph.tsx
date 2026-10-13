"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { EvidenceStatus } from "@/lib/domain/types";
import { EvidenceBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface HeroItem {
  id: string;
  slug: string;
  short: string;
  title: string;
  status: EvidenceStatus;
  openTasks: number;
  questions: { id: string; question: string }[];
  solution?: string;
  related: string[];
}

const W = 640;
const H = 560;
const CX = W / 2;
const CY = H / 2 - 6;

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  // Round so server and client render identical attribute strings.
  return { x: Math.round((CX + r * Math.cos(a)) * 10) / 10, y: Math.round((CY + r * Math.sin(a)) * 10) / 10 };
}

export function HeroGraph({ items }: { items: HeroItem[] }) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % items.length), 3800);
    return () => window.clearInterval(t);
  }, [paused, items.length]);

  const layout = useMemo(() => {
    return items.map((item, i) => {
      const angle = -90 + (360 / items.length) * i;
      const p = polar(150, angle);
      const n = item.questions.length;
      const qs = item.questions.map((q, j) => ({ ...q, ...polar(232 + (j % 2) * 18, angle + (j - (n - 1) / 2) * 15) }));
      const sol = item.solution ? { title: item.solution, ...polar(66, angle) } : null;
      const labelBelow = true;
      return { item, angle, ...p, qs, sol, labelBelow };
    });
  }, [items]);

  const index = new Map(layout.map((l, i) => [l.item.id, i]));
  const current = layout[active];

  const relatedEdges: Array<[number, number]> = [];
  layout.forEach((l, i) =>
    l.item.related.forEach((r) => {
      const j = index.get(r);
      if (j !== undefined && j > i) relatedEdges.push([i, j]);
    }),
  );

  return (
    <div className="relative" onMouseLeave={() => setPaused(false)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="group"
        aria-label="Interactive map of connected problems, their research questions and potential solutions"
      >
        <defs>
          <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3cc8f5" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#3cc8f5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={250} fill="url(#hero-glow)" />
        <circle cx={CX} cy={CY} r={150} fill="none" stroke="#ffffff0a" strokeDasharray="2 6" />
        <circle cx={CX} cy={CY} r={240} fill="none" stroke="#ffffff07" strokeDasharray="2 6" />

        {/* Cross-problem relationships */}
        {relatedEdges.map(([a, b]) => {
          const A = layout[a];
          const B = layout[b];
          const on = a === active || b === active;
          return (
            <path
              key={`${a}-${b}`}
              d={`M ${A.x} ${A.y} Q ${CX} ${CY} ${B.x} ${B.y}`}
              fill="none"
              stroke={on ? "#3cc8f5" : "#ffffff"}
              strokeOpacity={on ? 0.45 : 0.08}
              strokeWidth={1}
              className={on ? "edge-flow" : undefined}
            />
          );
        })}

        {layout.map((l, i) => {
          const on = i === active;
          return (
            <g key={l.item.id} opacity={on ? 1 : 0.55} style={{ transition: "opacity 300ms" }}>
              {l.qs.map((q) => (
                <g key={q.id}>
                  <line x1={l.x} y1={l.y} x2={q.x} y2={q.y} stroke={on ? "#8f9cf5" : "#ffffff"} strokeOpacity={on ? 0.55 : 0.12} />
                  <circle cx={q.x} cy={q.y} r={on ? 4.5 : 3.5} fill="#8f9cf5" fillOpacity={on ? 0.95 : 0.5} />
                </g>
              ))}
              {l.sol && (
                <g>
                  <line x1={l.x} y1={l.y} x2={l.sol.x} y2={l.sol.y} stroke={on ? "#5cc28f" : "#ffffff"} strokeOpacity={on ? 0.6 : 0.1} strokeDasharray="3 3" />
                  <rect x={l.sol.x - 4} y={l.sol.y - 4} width={8} height={8} transform={`rotate(45 ${l.sol.x} ${l.sol.y})`} fill="#5cc28f" fillOpacity={on ? 0.9 : 0.4} />
                </g>
              )}
            </g>
          );
        })}

        {layout.map((l, i) => {
          const on = i === active;
          return (
            <g
              key={`n-${l.item.id}`}
              role="button"
              tabIndex={0}
              aria-label={`${l.item.title}. ${l.item.questions.length} research questions, ${l.item.openTasks} open tasks. Press Enter to open.`}
              className="cursor-pointer focus:outline-none [&:focus-visible>circle:first-child]:stroke-accent"
              onMouseEnter={() => {
                setPaused(true);
                setActive(i);
              }}
              onFocus={() => {
                setPaused(true);
                setActive(i);
              }}
              onClick={() => router.push(`/problems/${l.item.slug}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/problems/${l.item.slug}`);
                }
              }}
            >
              <circle cx={l.x} cy={l.y} r={26} fill="transparent" stroke="transparent" strokeWidth={2} />
              {on && <circle cx={l.x} cy={l.y} r={20} fill="none" stroke="#3cc8f5" strokeOpacity={0.4} className="node-pulse" />}
              <circle cx={l.x} cy={l.y} r={on ? 12 : 10} fill="#0c0e11" stroke="#3cc8f5" strokeWidth={on ? 2 : 1.5} style={{ transition: "r 200ms" }} />
              <circle cx={l.x} cy={l.y} r={on ? 4.5 : 3.5} fill="#3cc8f5" />
              <text
                x={l.x}
                y={l.labelBelow ? l.y + 32 : l.y - 24}
                textAnchor="middle"
                className={cn("select-none text-[13px] font-medium", on ? "fill-fg" : "fill-fg-muted")}
              >
                {l.item.short}
              </text>
            </g>
          );
        })}
      </svg>

      {current && (
        <div className="mx-auto -mt-2 max-w-md rounded-lg border border-line bg-surface/90 p-4 backdrop-blur" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-snug text-fg">{current.item.title}</p>
            <EvidenceBadge status={current.item.status} className="shrink-0" />
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {current.item.questions.slice(0, 2).map((q) => (
              <li key={q.id} className="flex gap-2 text-[13px] leading-snug text-fg-muted">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-node-question" aria-hidden />
                <Link href={`/questions/${q.id}`} className="hover:text-fg">
                  {q.question}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between text-xs text-fg-subtle">
            <span>
              {current.item.questions.length} questions · {current.item.openTasks} open tasks
            </span>
            <Link href={`/problems/${current.item.slug}`} className="inline-flex items-center gap-1 text-accent hover:underline">
              Open <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-fg-subtle">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full border border-accent" /> Problem</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-node-question" /> Research question</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rotate-45 bg-node-solution" /> Potential solution</span>
      </div>
    </div>
  );
}
