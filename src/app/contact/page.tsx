import type { Metadata } from "next";
import { DocPage } from "@/components/layout/doc-page";
import { REPO_URL } from "@/lib/config";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  const title = subject?.slice(0, 200) ?? "";
  const issueUrl = `${REPO_URL}/issues/new${title ? `?title=${encodeURIComponent(title)}` : ""}`;
  return (
    <DocPage eyebrow="Contact" title="Get in touch" intro="UNsolved is developed in the open. The fastest way to reach maintainers is through GitHub.">
      <ul>
        <li><strong>Report a bug or a problem with content:</strong> <a href={issueUrl} target="_blank" rel="noreferrer">open an issue</a>{title && <> (pre-filled: “{title}”)</>}.</li>
        <li><strong>Propose a feature:</strong> open an issue using the feature request template.</li>
        <li><strong>Security vulnerabilities:</strong> do not open a public issue. Follow <a href={`${REPO_URL}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer">SECURITY.md</a>.</li>
        <li><strong>Abusive content on the platform:</strong> use the Report action on the content itself so moderators see it.</li>
      </ul>
    </DocPage>
  );
}
