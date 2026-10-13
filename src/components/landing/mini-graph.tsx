"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buildGraph, NODE_TYPES, type GraphNode, type NodeType } from "@/lib/graph/build";
import { NODE_COLOR, NODE_DESCRIPTION } from "@/components/graph/node-style";
import { useStore } from "@/components/providers/store-provider";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const COLUMN: Record<NodeType, number> = {
  problem: 0,
  cause: 1,
  question: 1,
  solution: 1,
  hypothesis: 2,
  task: 2,
  experiment: 3,
  contribution: 3,
};
const COL_X = [70, 250, 450, 620];
const ROW_H = 38;

const typeLabel = (t: NodeType) => NODE_TYPES.find((x) => x.id === t)!.label;

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function MiniGraph() {
  const { view } = useStore();
  const [problemId, setProblemId] = useState("p-water");
  const [selectedId, setSelectedId] = useState<string | null>("p-water");

  const { nodes, edges, height, pos } = useMemo(() => {
    const full = buildGraph(view);
    const nodes = full.nodes.filter((n) => n.problemId === problemId);
    const ids = new Set(nodes.map((n) => n.id));
    const edges = full.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    const parent = new Map<string, string>();
    for (const e of edges) if (!parent.has(e.target)) parent.set(e.target, e.source);
    const columns: GraphNode[][] = [[], [], [], []];
    const order = ["problem", "question", "cause", "solution", "hypothesis", "task", "experiment", "contribution"];
    const sorted = [...nodes].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    const rank = new Map<string, number>();
    for (const n of sorted) columns[COLUMN[n.type]].push(n);
    columns.forEach((col, ci) => {
      if (ci > 1) col.sort((a, b) => (rank.get(parent.get(a.id) ?? "") ?? 0) - (rank.get(parent.get(b.id) ?? "") ?? 0));
      col.forEach((n, i) => rank.set(n.id, i));
    });
    const rows = Math.max(...columns.map((c) => c.length));
    const height = Math.max(rows * ROW_H + 40, 200);
    const pos = new Map<string, { x: number; y: number }>();
    columns.forEach((col, ci) => {
      const offset = (height - col.length * ROW_H) / 2 + ROW_H / 2;
      col.forEach((n, i) => pos.set(n.id, { x: COL_X[ci], y: offset + i * ROW_H }));
    });
    return { nodes, edges, height, pos };
  }, [view, problemId]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const connected = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set([selectedId]);
    for (const e of edges) {
      if (e.source === selectedId) s.add(e.target);
      if (e.target === selectedId) s.add(e.source);
    }
    return s;
  }, [edges, selectedId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <label htmlFor="mini-graph-problem" className="text-xs text-fg-subtle">
            Problem
          </label>
          <Select
            id="mini-graph-problem"
            value={problemId}
            onChange={(e) => {
              setProblemId(e.target.value);
              setSelectedId(e.target.value);
            }}
            className="h-8 max-w-xs flex-1 text-[13px]"
          >
            {view.problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="bg-dots overflow-x-auto">
          <svg viewBox={`0 0 720 ${height}`} className="h-auto w-full min-w-[560px]" role="group" aria-label="Miniature problem graph">
            {edges.map((e) => {
              const a = pos.get(e.source)!;
              const b = pos.get(e.target)!;
              const on = connected?.has(e.source) && connected?.has(e.target);
              const mx = (a.x + b.x) / 2;
              return (
                <path
                  key={e.id}
                  d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
                  fill="none"
                  stroke={on ? "#3cc8f5" : "#ffffff"}
                  strokeOpacity={on ? 0.5 : 0.09}
                />
              );
            })}
            {nodes.map((n) => {
              const p = pos.get(n.id)!;
              const dim = connected && !connected.has(n.id);
              const isSel = n.id === selectedId;
              return (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={`${typeLabel(n.type)}: ${n.label}`}
                  onClick={() => setSelectedId(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(n.id);
                    }
                  }}
                  className="cursor-pointer focus:outline-none [&:focus-visible>rect]:stroke-accent"
                  opacity={dim ? 0.3 : 1}
                  style={{ transition: "opacity 200ms" }}
                >
                  <rect x={p.x - 8} y={p.y - 12} width={150} height={24} rx={6} fill={isSel ? "#191d22" : "transparent"} stroke={isSel ? "#2a3038" : "transparent"} />
                  <circle cx={p.x} cy={p.y} r={n.type === "problem" ? 6 : 4} fill={NODE_COLOR[n.type]} />
                  <text x={p.x + 12} y={p.y + 4} className="select-none fill-fg-muted text-[11px]">
                    {truncate(n.label, n.type === "problem" ? 26 : 22)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <aside className="rounded-lg border border-line bg-surface p-4" aria-live="polite">
        {selected ? (
          <>
            <p className="flex items-center gap-2 text-xs text-fg-subtle">
              <span className="size-2 rounded-full" style={{ background: NODE_COLOR[selected.type] }} aria-hidden />
              {typeLabel(selected.type)}
            </p>
            <p className="mt-2 text-sm font-medium leading-snug text-fg">{selected.label}</p>
            {selected.detail && <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-fg-muted">{selected.detail}</p>}
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-fg-subtle">{NODE_DESCRIPTION[selected.type]}</p>
            <Link href={selected.href} className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
              Open record <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </>
        ) : (
          <p className="text-sm text-fg-muted">Select a node to inspect it.</p>
        )}
        <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-line pt-4">
          {NODE_TYPES.map((t) => (
            <li key={t.id} className={cn("flex items-center gap-1.5 text-[11.5px] text-fg-subtle")}>
              <span className="size-2 rounded-full" style={{ background: NODE_COLOR[t.id] }} aria-hidden />
              {t.label}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
