import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/layout/doc-page";
import { ResetDemo } from "@/components/layout/reset-demo";
import { EVIDENCE_STATUS_META, TASK_STATUS_META, CONTRIBUTION_STATUS_META, CLAIM_KIND_META } from "@/lib/domain/labels";
import { REPO_URL } from "@/lib/config";

export const metadata: Metadata = { title: "Documentation", description: "How UNsolved models problems, evidence, tasks and validation." };

export default function DocsPage() {
  return (
    <DocPage eyebrow="Documentation" title="How UNsolved works" intro="A reference for contributors and reviewers. Developer documentation (architecture, database, deployment) lives in the repository.">
      <h2>The records</h2>
      <ul>
        <li><strong>Problem</strong> — a precisely defined challenge with causes, current evidence, existing approaches, known limitations and <em>validation criteria</em>.</li>
        <li><strong>Research question</strong> — a focused question under one problem. Anyone signed in can propose one; moderators accept it before it appears.</li>
        <li><strong>Hypothesis</strong> and <strong>experiment</strong> — testable claims and the designed tests for them.</li>
        <li><strong>Task</strong> — a unit of work under a research question, with a deliverable, difficulty, effort estimate and acceptance criteria.</li>
        <li><strong>Contribution</strong> — work submitted for a task, optionally flagged as a negative result.</li>
        <li><strong>Review</strong> — an independent check of a contribution against the task&apos;s acceptance criteria.</li>
        <li><strong>Solution</strong> — a candidate approach to a problem, linked to the questions it depends on.</li>
      </ul>
      <h2>Evidence statuses</h2>
      <ul>{Object.values(EVIDENCE_STATUS_META).map((m) => <li key={m.label}><strong>{m.label}</strong> — {m.description}</li>)}</ul>
      <h2>Claim labels</h2>
      <ul>{Object.values(CLAIM_KIND_META).map((m) => <li key={m.label}><strong>{m.label}</strong> — {m.description}</li>)}</ul>
      <h2>Task workflow</h2>
      <ol>
        <li><strong>{TASK_STATUS_META.open.label}</strong> — anyone signed in can claim it (up to three active tasks each).</li>
        <li><strong>{TASK_STATUS_META.in_progress.label}</strong> — the assignee works on it and can release it at any time.</li>
        <li><strong>{TASK_STATUS_META.in_review.label}</strong> — a contribution was submitted; a reviewer who is not the author checks each acceptance criterion.</li>
        <li><strong>{TASK_STATUS_META.completed.label}</strong> — the deliverable was accepted. Requested changes return the task to in progress; a rejection reopens it.</li>
        <li><strong>{TASK_STATUS_META.blocked.label}</strong> — waiting on another task.</li>
      </ol>
      <p>Contribution statuses: {Object.values(CONTRIBUTION_STATUS_META).map((m) => m.label).join(", ")}. <strong>Accepting a deliverable never changes the evidence status of a question or solution.</strong></p>
      <h2>Recommendations and assistance</h2>
      <p>Task suggestions are rule-based: they match your profile skills, interests and followed problems, and each suggestion explains why it was made. Duplicate detection on the submission form uses keyword similarity. If the instance operator configures an AI provider, the “Check my draft” assistant can review proposals for missing information; its output is labeled as AI-generated and unverified, and it is instructed never to supply citations.</p>
      <h2>Moderation and reporting</h2>
      <p>New problems and research questions enter a review queue and are published with status “Proposed” only after a moderator accepts them. Any signed-in user can report a contribution for spam, harassment, misleading claims or plagiarism. See the <Link href="/guidelines">contribution guidelines</Link>.</p>
      <h2 id="reset">Demo data</h2>
      <p>In demo mode your actions are stored in this browser only.</p>
      <ResetDemo />
      <h2>For developers</h2>
      <p>Setup, architecture, database schema and the roadmap are documented in the <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub repository</a>.</p>
    </DocPage>
  );
}
