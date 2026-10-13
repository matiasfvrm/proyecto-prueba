import type { Metadata } from "next";
import { seedCatalog } from "@/lib/data/seed";
import { ProblemDetail } from "@/components/problems/problem-detail";
import { TABS, type TabId } from "@/components/problems/tabs";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = seedCatalog.problems.find((x) => x.slug === slug);
  if (!p) return { title: "Problem" };
  return { title: p.title, description: p.summary };
}

export default async function ProblemPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const initialTab: TabId = TABS.some((t) => t.id === tab) ? (tab as TabId) : "overview";
  return <ProblemDetail key={`${slug}-${initialTab}`} slug={slug} initialTab={initialTab} />;
}
