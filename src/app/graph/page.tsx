import type { Metadata } from "next";
import { Suspense } from "react";
import { KnowledgeGraph } from "@/components/graph/knowledge-graph";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Problem graph",
  description: "Explore how problems, causes, research questions, hypotheses, experiments, tasks, contributions and solutions connect.",
};

export default function GraphPage() {
  return (
    <>
      <h1 className="sr-only">Problem graph</h1>
      <Suspense fallback={<Skeleton className="m-4 h-[70vh]" />}>
        <KnowledgeGraph />
      </Suspense>
    </>
  );
}
