import type { Catalog } from "@/lib/domain/types";

export const NODE_TYPES = [
  { id: "problem", label: "Problem" },
  { id: "cause", label: "Cause" },
  { id: "question", label: "Research question" },
  { id: "hypothesis", label: "Hypothesis" },
  { id: "experiment", label: "Experiment" },
  { id: "task", label: "Task" },
  { id: "contribution", label: "Contribution" },
  { id: "solution", label: "Solution" },
] as const;
export type NodeType = (typeof NODE_TYPES)[number]["id"];

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  status?: string;
  href: string;
  problemId: string;
  detail?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(c: Pick<Catalog, "problems" | "questions" | "hypotheses" | "experiments" | "tasks" | "contributions" | "solutions">): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edge = (source: string, target: string, relation: string) =>
    edges.push({ id: `${source}->${target}`, source, target, relation });

  const problemById = new Map(c.problems.map((p) => [p.id, p]));
  const questionById = new Map(c.questions.map((q) => [q.id, q]));
  const hypothesisById = new Map(c.hypotheses.map((h) => [h.id, h]));

  for (const p of c.problems) {
    const href = `/problems/${p.slug}`;
    nodes.push({ id: p.id, type: "problem", label: p.title, status: p.status, href, problemId: p.id, detail: p.summary });
    for (const cause of p.causes) {
      nodes.push({ id: cause.id, type: "cause", label: cause.title, href: `${href}#causes`, problemId: p.id, detail: cause.description });
      edge(p.id, cause.id, "is driven by");
    }
  }
  const seenRelated = new Set<string>();
  for (const p of c.problems) {
    for (const r of p.relatedProblemIds) {
      const key = [p.id, r].sort().join("|");
      if (problemById.has(r) && !seenRelated.has(key)) {
        seenRelated.add(key);
        edge(p.id, r, "relates to");
      }
    }
  }
  for (const q of c.questions) {
    const p = problemById.get(q.problemId);
    if (!p) continue;
    nodes.push({ id: q.id, type: "question", label: q.question, status: q.status, href: `/questions/${q.id}`, problemId: p.id, detail: q.whyItMatters });
    edge(p.id, q.id, "asks");
  }
  for (const h of c.hypotheses) {
    const q = questionById.get(h.questionId);
    if (!q) continue;
    nodes.push({ id: h.id, type: "hypothesis", label: h.statement, status: h.status, href: `/questions/${q.id}#hypotheses`, problemId: q.problemId });
    edge(q.id, h.id, "proposes");
  }
  for (const e of c.experiments) {
    const h = hypothesisById.get(e.hypothesisId);
    const q = h && questionById.get(h.questionId);
    if (!h || !q) continue;
    nodes.push({ id: e.id, type: "experiment", label: e.title, status: e.status, href: `/questions/${q.id}#hypotheses`, problemId: q.problemId, detail: e.design });
    edge(h.id, e.id, "tested by");
  }
  for (const t of c.tasks) {
    if (!questionById.has(t.questionId)) continue;
    nodes.push({ id: t.id, type: "task", label: t.title, status: t.status, href: `/tasks/${t.id}`, problemId: t.problemId, detail: t.objective });
    edge(t.questionId, t.id, "needs");
  }
  for (const k of c.contributions) {
    if (!c.tasks.some((t) => t.id === k.taskId)) continue;
    nodes.push({ id: k.id, type: "contribution", label: k.title, status: k.status, href: `/tasks/${k.taskId}#contributions`, problemId: k.problemId, detail: k.summary });
    edge(k.taskId, k.id, "delivered");
  }
  for (const s of c.solutions) {
    const p = problemById.get(s.problemId);
    if (!p) continue;
    nodes.push({ id: s.id, type: "solution", label: s.title, status: s.status, href: `/problems/${p.slug}?tab=evidence#solutions`, problemId: p.id, detail: s.summary });
    edge(p.id, s.id, "may be solved by");
    for (const qid of s.questionIds) if (questionById.has(qid)) edge(s.id, qid, "depends on");
  }
  return { nodes, edges };
}

/** Ids of a node and its direct neighbours. */
export function neighbourhood(graph: KnowledgeGraph, id: string): Set<string> {
  const out = new Set([id]);
  for (const e of graph.edges) {
    if (e.source === id) out.add(e.target);
    if (e.target === id) out.add(e.source);
  }
  return out;
}
