import { Container, Eyebrow } from "@/components/ui/misc";

/** Long-form text page with consistent typography. Content is static and authored in the repo. */
export function DocPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-3 text-[17px] leading-relaxed text-fg-muted">{intro}</p>}
        <div className="doc mt-10 space-y-5 text-[15px] leading-relaxed text-fg-muted [&_a]:text-accent [&_a:hover]:underline [&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:text-[13px] [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:font-medium [&_h3]:text-fg [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-fg [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-fg-subtle">
          {children}
        </div>
      </div>
    </Container>
  );
}
