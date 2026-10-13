import Link from "next/link";
import { LogoMark } from "./logo";
import { Container } from "@/components/ui/misc";
import { REPO_URL } from "@/lib/config";

const groups = [
  {
    title: "Platform",
    links: [
      { href: "/problems", label: "Discover problems" },
      { href: "/graph", label: "Problem graph" },
      { href: "/contribute", label: "Find a task" },
      { href: "/submit", label: "Submit a problem" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about", label: "About" },
      { href: "/docs", label: "Documentation" },
      { href: "/guidelines", label: "Contribution guidelines" },
      { href: REPO_URL, label: "GitHub repository", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight">
              <span className="text-accent">UN</span>solved
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">
            An open platform for turning humanity&apos;s unsolved problems into collaborative, measurable progress.
          </p>
          <p className="mt-4 text-xs text-fg-subtle">Open source under AGPL-3.0. Content contributions under CC BY 4.0.</p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{g.title}</h2>
            <ul className="mt-3 space-y-2">
              {g.links.map((l) => (
                <li key={l.href}>
                  {"external" in l && l.external ? (
                    <a href={l.href} className="text-sm text-fg-muted hover:text-fg" target="_blank" rel="noreferrer noopener">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm text-fg-muted hover:text-fg">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
    </footer>
  );
}
