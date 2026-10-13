import type { Metadata } from "next";
import { SubmitProblemForm } from "@/components/forms/submit-problem-form";
import { Container, PageHeader } from "@/components/ui/misc";
import { assistantMode } from "@/lib/ai";

export const metadata: Metadata = { title: "Submit a problem", description: "Propose a new problem for the UNsolved review queue." };
export const dynamic = "force-dynamic";

export default function SubmitPage() {
  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Submit"
        title="Propose a problem"
        description="Good proposals are specific, cite their evidence, and suggest how the problem could be broken down. A moderator reviews every submission before it is published."
      />
      <SubmitProblemForm assistantMode={assistantMode()} />
    </Container>
  );
}
