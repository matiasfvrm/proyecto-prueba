import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3-force";
import type { KnowledgeGraph, NodeType } from "./build";

interface SimNode extends SimulationNodeDatum {
  id: string;
  type: NodeType;
  problemId: string;
}

const LINK_DISTANCE: Partial<Record<NodeType, number>> = { problem: 260, question: 90, cause: 80, solution: 100 };

/**
 * Deterministic force-directed layout (d3-force uses a seeded RNG).
 * Each problem's records are pulled toward an anchor so clusters stay readable.
 */
export function layoutGraph(graph: KnowledgeGraph): Map<string, { x: number; y: number }> {
  const problems = graph.nodes.filter((n) => n.type === "problem");
  const anchors = new Map<string, { x: number; y: number }>();
  const R = 95 * Math.max(3, problems.length);
  problems.forEach((p, i) => {
    const a = (2 * Math.PI * i) / problems.length - Math.PI / 2;
    anchors.set(p.id, { x: Math.cos(a) * R, y: Math.sin(a) * R * 0.75 });
  });

  const nodes: SimNode[] = graph.nodes.map((n) => {
    const a = anchors.get(n.problemId) ?? { x: 0, y: 0 };
    return { id: n.id, type: n.type, problemId: n.problemId, x: a.x, y: a.y };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = graph.edges.map((e) => ({ source: e.source, target: e.target }));

  const sim = forceSimulation(nodes)
    .force(
      "link",
      forceLink<SimNode, { source: string | SimNode; target: string | SimNode }>(links)
        .id((d) => d.id)
        .distance((l) => {
          const s = l.source as SimNode;
          const t = l.target as SimNode;
          if (s.type === "problem" && t.type === "problem") return LINK_DISTANCE.problem!;
          return LINK_DISTANCE[t.type] ?? 70;
        })
        .strength((l) => ((l.source as SimNode).type === "problem" && (l.target as SimNode).type === "problem" ? 0.02 : 0.7)),
    )
    .force("charge", forceManyBody<SimNode>().strength((d) => (d.type === "problem" ? -900 : -220)))
    .force("collide", forceCollide<SimNode>((d) => (d.type === "problem" ? 60 : 34)))
    .force("x", forceX<SimNode>((d) => anchors.get(d.problemId)?.x ?? 0).strength(0.06))
    .force("y", forceY<SimNode>((d) => anchors.get(d.problemId)?.y ?? 0).strength(0.06))
    .stop();

  for (let i = 0; i < 320; i++) sim.tick();

  const out = new Map<string, { x: number; y: number }>();
  for (const [id, n] of byId) out.set(id, { x: Math.round(n.x ?? 0), y: Math.round(n.y ?? 0) });
  return out;
}
