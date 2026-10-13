import type { Metadata } from "next";
import { seedCatalog } from "@/lib/data/seed";
import { TaskDetail } from "@/components/tasks/task-detail";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return seedCatalog.tasks.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = seedCatalog.tasks.find((x) => x.id === id);
  return t ? { title: t.title, description: t.objective } : { title: "Task" };
}

export default async function TaskPage({ params }: Props) {
  const { id } = await params;
  return <TaskDetail id={id} />;
}
