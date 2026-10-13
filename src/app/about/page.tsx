import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/layout/doc-page";
import { REPO_URL } from "@/lib/config";

export const metadata: Metadata = { title: "About", description: "What UNsolved is, what it is not, and how demo mode works." };

export default function AboutPage() {
  return (
    <DocPage eyebrow="About" title="Turning unsolved problems into collaborative, measurable progress" intro="UNsolved is an open-source platform for structuring hard problems so that many people can make careful, verifiable progress on them together.">
      <h2>Why</h2>
      <p>Important problems stay unsolved for many reasons. Knowledge is fragmented across papers, reports and private notes. It is hard to tell what is established and what is speculation. And people who want to help often cannot see where a few hours of their time would actually be useful.</p>
      <p>UNsolved gives every problem the same structure: <strong>Problem → Evidence → Research questions → Tasks → Contributions → Validation → Documented outcomes</strong>. Each record is connected in a graph, so work done for one problem can be found and reused by another.</p>
      <h2>Principles</h2>
      <ul>
        <li><strong>Evidence carries its status.</strong> Every claim is labeled as documented in sources, hypothesis, unverified proposal, or supported by validated evidence.</li>
        <li><strong>Work is not the same as validation.</strong> Completing a task means its deliverable met the acceptance criteria. Validation of a claim requires its own criteria and independent review.</li>
        <li><strong>Negative results are results.</strong> Failed experiments are documented so nobody repeats them blindly.</li>
        <li><strong>No popularity scores.</strong> Profiles separate activity from verified impact.</li>
        <li><strong>AI is optional.</strong> The core workflow works without any AI provider. When AI is used, its output is labeled and treated as unverified.</li>
      </ul>
      <h2>What UNsolved is not</h2>
      <ul>
        <li>Not a social network or discussion forum — there are no likes or follower counts on people.</li>
        <li>Not a general task manager — every task exists to answer a research question.</li>
        <li>Not a chatbot, and not a claim that technology will solve these problems by itself.</li>
      </ul>
      <h2 id="demo-mode">Demo mode</h2>
      <p>When no database is configured, UNsolved runs in <strong>demo mode</strong>:</p>
      <ul>
        <li>The seven problems, their questions, tasks and contributions are <strong>illustrative demonstration content</strong>. They link to real public sources for context, but they do not report findings from those sources, and nothing in them has been validated by UNsolved.</li>
        <li>Contributor profiles marked “Demo” are <strong>fictional</strong>.</li>
        <li>Everything you do — creating a profile, claiming tasks, submitting work, reviewing — is validated by the server and then stored <strong>only in your browser</strong> (localStorage). Nothing is written to a shared database, and other visitors cannot see it.</li>
        <li>You can reset the demo at any time from the <Link href="/docs#reset">documentation page</Link>.</li>
      </ul>
      <p>With Supabase configured, user-generated records (profiles, follows, claims, contributions, reviews, submissions, reports) persist in PostgreSQL with Row Level Security. See the <a href={`${REPO_URL}#readme`} target="_blank" rel="noreferrer">README</a> for setup.</p>
      <h2>Open source</h2>
      <p>The code is licensed under the GNU Affero General Public License v3.0 or later, so improvements to hosted versions stay open. Content contributions (problem descriptions, reviews, documentation) are intended to be shared under CC BY 4.0. The reasoning is in the repository&apos;s <code>docs/LICENSING.md</code>.</p>
    </DocPage>
  );
}
