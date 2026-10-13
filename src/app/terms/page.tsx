import type { Metadata } from "next";
import { DocPage } from "@/components/layout/doc-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <DocPage eyebrow="Legal" title="Terms of use" intro="Baseline terms for this open-source software. Operators of a hosted instance should adapt them and have them reviewed for their jurisdiction.">
      <h2>Content you contribute</h2>
      <ul>
        <li>You keep the rights to what you contribute and agree to license written content under CC BY 4.0 and code under the license of the repository you contribute it to.</li>
        <li>Only submit work you have the right to share, and attribute others&apos; work properly.</li>
      </ul>
      <h2>No warranty and no professional advice</h2>
      <p>Information on the platform is provided as-is. Content labeled as a hypothesis, proposal or AI-generated suggestion is unverified. Nothing here is medical, engineering, legal or safety advice; consult qualified professionals before acting on it.</p>
      <h2>Acceptable use</h2>
      <p>Do not post spam, harass others, misrepresent evidence, or attempt to disrupt the service. Moderators may hide or remove content and suspend accounts that violate the Code of Conduct.</p>
      <h2>Demo content</h2>
      <p>Demonstration problems and profiles are illustrative and fictional where labeled. They are not statements of fact about real people or organizations.</p>
    </DocPage>
  );
}
