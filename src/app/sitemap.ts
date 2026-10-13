import type { MetadataRoute } from "next";
import { seedCatalog } from "@/lib/data/seed";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pages = ["", "/problems", "/graph", "/contribute", "/about", "/docs", "/guidelines", "/privacy", "/terms", "/contact"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...seedCatalog.problems.map((p) => ({ url: `${base}/problems/${p.slug}`, lastModified: p.updatedAt })),
    ...seedCatalog.questions.map((q) => ({ url: `${base}/questions/${q.id}` })),
    ...seedCatalog.tasks.map((t) => ({ url: `${base}/tasks/${t.id}` })),
  ];
}
