import type { Metadata } from "next";
import { Suspense } from "react";
import { TaskFinder } from "@/components/tasks/task-finder";
import { Container, PageHeader, Skeleton } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Find a well-scoped task that matches your skills: code, research, writing, data analysis, design or experimentation.",
};

export default function ContributePage() {
  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Contribute"
        title="Find a task that fits your skills"
        description={<>Every task states its deliverable, difficulty and acceptance criteria. Claim one, submit your work, and an independent reviewer checks it. New here? Start with an <strong className="font-medium text-fg">Introductory</strong> task.</>}
        actions={<LinkButton href="/guidelines" variant="secondary">Contribution guidelines</LinkButton>}
      />
      <Suspense fallback={<Skeleton className="mt-8 h-96" />}>
        <TaskFinder />
      </Suspense>
    </Container>
  );
}
