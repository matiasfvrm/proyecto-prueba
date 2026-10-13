import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/layout/doc-page";
import { REPO_URL } from "@/lib/config";

export const metadata: Metadata = { title: "Contribution guidelines" };

export default function GuidelinesPage() {
  return (
    <DocPage eyebrow="Guidelines" title="Contribution guidelines" intro="How to contribute research, code and reviews that others can trust and build on.">
      <h2>Before you start</h2>
      <ul>
        <li>Read the problem&apos;s definition, limitations and validation criteria, and the task&apos;s acceptance criteria.</li>
        <li>Claim a task before working on it, so effort is not duplicated. Release it if you cannot continue.</li>
        <li>Start with an Introductory task if you are new. You do not need to be an expert.</li>
      </ul>
      <h2>Evidence and citations</h2>
      <ul>
        <li>Cite a source for every factual claim, and only cite sources you have actually read.</li>
        <li>Never invent references, figures or quotations. Mark uncertain statements as uncertain.</li>
        <li>Label synthetic or simulated data clearly.</li>
        <li>If you used an AI tool, say how, and verify everything it produced yourself.</li>
      </ul>
      <h2>Negative results</h2>
      <p>If an experiment did not support its hypothesis, submit it anyway and flag it as a negative result. Explain what you did and why it might not have worked.</p>
      <h2>Reviewing</h2>
      <ul>
        <li>Review against the published acceptance criteria, not personal preference.</li>
        <li>Accept only if every criterion is met. Otherwise request specific changes.</li>
        <li>Be specific and kind. Critique the work, never the person.</li>
        <li>Never review your own work or work you have a conflict of interest with.</li>
      </ul>
      <h2>Conduct</h2>
      <p>Everyone participating agrees to the project&apos;s <a href={`${REPO_URL}/blob/main/CODE_OF_CONDUCT.md`} target="_blank" rel="noreferrer">Code of Conduct</a>. Use the Report action on any contribution to flag spam, harassment, misleading claims or plagiarism.</p>
      <h2>Contributing to the software</h2>
      <p>Code contributions follow <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">CONTRIBUTING.md</a> in the repository. Questions? See the <Link href="/contact">contact page</Link>.</p>
    </DocPage>
  );
}
