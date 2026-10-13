import type { Metadata } from "next";
import { seedCatalog } from "@/lib/data/seed";
import { QuestionDetail } from "@/components/questions/question-detail";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return seedCatalog.questions.map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const q = seedCatalog.questions.find((x) => x.id === id);
  return q ? { title: q.question, description: q.whyItMatters } : { title: "Research question" };
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params;
  return <QuestionDetail id={id} />;
}
