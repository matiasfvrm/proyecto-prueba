import type { Metadata } from "next";
import { DocPage } from "@/components/layout/doc-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <DocPage eyebrow="Legal" title="Privacy" intro="Plain-language description of what this software stores. Operators of a hosted instance must publish their own privacy policy covering their deployment.">
      <h2>Demo mode</h2>
      <ul>
        <li>Profiles you create and actions you take are stored in your browser&apos;s localStorage. They are not sent to a database.</li>
        <li>Each action is sent to the server once for validation and rate limiting. The server does not store it. Your IP address is held in memory for rate limiting only and is discarded when the window expires or the server restarts.</li>
        <li>No analytics, tracking cookies or third-party scripts are included.</li>
      </ul>
      <h2>With a database configured</h2>
      <ul>
        <li>Your email address is handled by the authentication provider (Supabase Auth) and is not shown publicly.</li>
        <li>Your profile, contributions, reviews and activity are public by design, because open collaboration depends on attribution.</li>
        <li>Which problems you follow, and the reports you file, are visible only to you (and reports to moderators).</li>
      </ul>
      <h2>AI assistance</h2>
      <p>If the operator configures an AI provider, the “Check my draft” feature sends only the text of your draft proposal to that provider. Your profile and identity are not included. The feature is optional.</p>
      <h2>Your choices</h2>
      <p>In demo mode you can delete all local data from the Documentation page. With a database, contact the instance operator to export or delete your data.</p>
    </DocPage>
  );
}
