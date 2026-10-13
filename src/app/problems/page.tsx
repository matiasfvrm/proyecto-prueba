import type { Metadata } from "next";
import { Suspense } from "react";
import { Discover } from "@/components/problems/discover";
import { Container, PageHeader, Skeleton } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Discover problems",
  description: "Search and filter open problems by category, evidence status, difficulty, skills and activity.",
};

function DiscoverFallback() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading problems">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-72" />
      ))}
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Discover"
        title="Open problems"
        description="Each problem has a precise definition, the current state of evidence, open research questions and concrete tasks. Filter by what you care about or what you can do."
        actions={
          <LinkButton href="/submit" variant="secondary">
            <Plus className="size-4" aria-hidden /> Submit a problem
          </LinkButton>
        }
      />
      <Suspense fallback={<DiscoverFallback />}>
        <Discover />
      </Suspense>
    </Container>
  );
}
