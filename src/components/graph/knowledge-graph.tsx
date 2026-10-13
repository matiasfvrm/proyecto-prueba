"use client";

import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore as useFlowStore,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { ArrowRight, Search, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { buildGraph, neighbourhood, NODE_TYPES, type GraphNode, type NodeType } from "@/lib/graph/build";
import { layoutGraph } from "@/lib/graph/layout";
import { NODE_COLOR, NODE_DESCRIPTION } from "./node-style";
import { Chip, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EVIDENCE_STATUS_META, TASK_STATUS_META, CONTRIBUTION_STATUS_META } from "@/lib/domain/labels";
import { cn } from "@/lib/utils";

type FlowData = { node: GraphNode; dim: boolean; selected: boolean };
type FlowNode = Node<FlowData, "knowledge">;

const hidden = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0, top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

const KnowledgeNode = memo(function KnowledgeNode({ data }: NodeProps<FlowNode>) {
  const { node, dim, selected } = data;
  const isProblem = node.type === "problem";
  // Hide secondary labels when zoomed out so the overview stays legible.
  const zoomedOut = useFlowStore((s) => s.transform[2] < 0.7);
  const showLabel = isProblem || selected || !zoomedOut;
  const color = NODE_COLOR[node.type];
  return (
    <div className={cn("relative flex items-center gap-2 transition-opacity", dim && "opacity-20")} style={{ transform: `translate(${isProblem ? -10 : -6}px, -50%)` }}>
      <span
        className={cn("relative block shrink-0 rounded-full", isProblem ? "size-5 border-2" : "size-3")}
        style={isProblem ? { borderColor: color, background: "#0c0e11", boxShadow: selected ? `0 0 0 4px ${color}33` : undefined } : { background: color, boxShadow: selected ? `0 0 0 4px ${color}40` : undefined }}
      >
        <Handle type="target" position={Position.Top} style={hidden} isConnectable={false} />
        <Handle type="source" position={Position.Bottom} style={hidden} isConnectable={false} />
      </span>
      {showLabel && <span
        className={cn(
          "pointer-events-none max-w-[180px] truncate rounded px-1 text-[11px] leading-4",
          isProblem ? (zoomedOut ? "max-w-[320px] text-[24px] font-semibold text-fg" : "max-w-[220px] text-[13px] font-semibold text-fg") : "text-fg-muted",
          selected && "bg-surface-3 text-fg",
        )}
      >
        {node.label}
      </span>}
    </div>
  );
});

const nodeTypes = { knowledge: KnowledgeNode };

function statusLabel(n: GraphNode): string | null {
  if (!n.status) return null;
  if (n.type === "task") return TASK_STATUS_META[n.status as keyof typeof TASK_STATUS_META]?.label ?? null;
  if (n.type === "contribution") return CONTRIBUTION_STATUS_META[n.status as keyof typeof CONTRIBUTION_STATUS_META]?.label ?? null;
  return EVIDENCE_STATUS_META[n.status as keyof typeof EVIDENCE_STATUS_META]?.label ?? null;
}

function GraphInner() {
  const { view } = useStore();
  const params = useSearchParams();
  const flow = useReactFlow();
  const graph = useMemo(() => buildGraph(view), [view]);
  const positions = useMemo(() => layoutGraph(graph), [graph]);
  const [visible, setVisible] = useState<Set<NodeType>>(() => new Set(NODE_TYPES.map((t) => t.id)));
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("focus"));
  const [query, setQuery] = useState("");

  const focusNode = useCallback(
    (id: string) => {
      setSelectedId(id);
      void flow.fitView({ nodes: [{ id }], maxZoom: 1.1, minZoom: 1.1, duration: 500 });
    },
    [flow],
  );

  const initialFocus = useMemo(() => {
    const f = params.get("focus");
    return f && graph.nodes.some((n) => n.id === f) ? f : null;
    // Only the first render matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const near = useMemo(() => (selectedId ? neighbourhood(graph, selectedId) : null), [graph, selectedId]);

  const nodes: FlowNode[] = useMemo(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: "knowledge",
        position: positions.get(n.id) ?? { x: 0, y: 0 },
        hidden: !visible.has(n.type),
        data: { node: n, dim: !!near && !near.has(n.id), selected: n.id === selectedId },
        draggable: false,
        connectable: false,
        ariaLabel: `${NODE_TYPES.find((t) => t.id === n.type)?.label}: ${n.label}`,
      })),
    [graph, positions, visible, near, selectedId],
  );

  const edges: Edge[] = useMemo(() => {
    const shown = new Set(graph.nodes.filter((n) => visible.has(n.type)).map((n) => n.id));
    return graph.edges
      .filter((e) => shown.has(e.source) && shown.has(e.target))
      .map((e) => {
        const on = !!selectedId && (e.source === selectedId || e.target === selectedId);
        const crossProblem = e.relation === "relates to";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "straight",
          style: {
            stroke: on ? "#3cc8f5" : "#ffffff",
            strokeOpacity: on ? 0.75 : near ? 0.05 : crossProblem ? 0.25 : 0.2,
            strokeWidth: on ? 1.5 : 1,
            strokeDasharray: crossProblem ? "4 4" : undefined,
          },
        };
      });
  }, [graph, visible, selectedId, near]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return graph.nodes.filter((n) => visible.has(n.type) && n.label.toLowerCase().includes(q)).slice(0, 8);
  }, [graph, query, visible]);

  const selected = graph.nodes.find((n) => n.id === selectedId) ?? null;
  const neighbours = selected ? graph.nodes.filter((n) => near?.has(n.id) && n.id !== selected.id) : [];

  return (
    <div className="grid h-[calc(100dvh-8.5rem)] min-h-[560px] grid-rows-[auto_1fr] lg:grid-cols-[1fr_340px] lg:grid-rows-1">
      <div className="relative order-2 min-h-[420px] border-line lg:order-1 lg:border-r">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          fitView
          fitViewOptions={initialFocus ? { nodes: [{ id: initialFocus }], minZoom: 1.1, maxZoom: 1.1 } : { padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2.5}
          nodesDraggable={false}
          nodesConnectable={false}
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#ffffff14" />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
      </div>

      <aside className="order-1 space-y-4 overflow-y-auto border-b border-line bg-bg p-4 lg:order-2 lg:border-b-0" aria-label="Graph controls and inspector">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <label htmlFor="graph-search" className="sr-only">Search nodes</label>
          <Input id="graph-search" type="search" placeholder="Search nodes…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" autoComplete="off" />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line-strong bg-surface-2 shadow-xl" role="listbox" aria-label="Matching nodes">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    role="option"
                    aria-selected={m.id === selectedId}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-fg-muted hover:bg-surface-3 hover:text-fg"
                    onClick={() => {
                      focusNode(m.id);
                      setQuery("");
                    }}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: NODE_COLOR[m.type] }} aria-hidden />
                    <span className="truncate">{m.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length >= 2 && matches.length === 0 && <p className="mt-2 text-xs text-fg-subtle">No visible nodes match “{query}”.</p>}
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">Node types</legend>
          <div className="flex flex-wrap gap-1.5">
            {NODE_TYPES.map((t) => (
              <Chip
                key={t.id}
                selected={visible.has(t.id)}
                className="text-[12px]"
                onToggle={() =>
                  setVisible((v) => {
                    const n = new Set(v);
                    if (n.has(t.id)) n.delete(t.id);
                    else n.add(t.id);
                    return n;
                  })
                }
              >
                <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: NODE_COLOR[t.id] }} aria-hidden />
                {t.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="rounded-lg border border-line bg-surface p-4" aria-live="polite">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-2 text-xs text-fg-subtle">
                  <span className="size-2 rounded-full" style={{ background: NODE_COLOR[selected.type] }} aria-hidden />
                  {NODE_TYPES.find((t) => t.id === selected.type)?.label}
                  {statusLabel(selected) && <span>· {statusLabel(selected)}</span>}
                </p>
                <Button variant="ghost" size="sm" className="-mr-2 -mt-1 h-7 px-1.5" aria-label="Clear selection" onClick={() => setSelectedId(null)}>
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug text-fg">{selected.label}</p>
              {selected.detail && <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{selected.detail}</p>}
              <p className="mt-3 text-xs text-fg-subtle">{NODE_DESCRIPTION[selected.type]}</p>
              <Link href={selected.href} className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                Open record <ArrowRight className="size-3.5" aria-hidden />
              </Link>
              {neighbours.length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-xs font-medium text-fg-subtle">Connected ({neighbours.length})</p>
                  <ul className="space-y-1">
                    {neighbours.map((n) => (
                      <li key={n.id}>
                        <button onClick={() => focusNode(n.id)} className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-[13px] text-fg-muted hover:bg-surface-3 hover:text-fg">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: NODE_COLOR[n.type] }} aria-hidden />
                          <span className="truncate">{n.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-fg-muted">Click a node, or search, to inspect it and highlight its connections. Scroll to zoom, drag to pan.</p>
          )}
        </div>
        <p className="text-xs text-fg-subtle">
          {graph.nodes.length} nodes · {graph.edges.length} relationships, generated from the application&apos;s records. Dashed lines connect related problems.
        </p>
      </aside>
    </div>
  );
}

export function KnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  );
}
