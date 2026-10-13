import type { Catalog } from "@/lib/domain/types";
import { APP_MODE } from "@/lib/config";
import { seedCatalog } from "./seed";

/**
 * Catalog used when a real database is configured: the editorial content stays,
 * but fictional demo profiles, their contributions and their task claims are removed
 * so no demo activity is presented as real.
 */
export function productionCatalog(seed: Catalog): Catalog {
  return {
    ...seed,
    users: [],
    contributions: [],
    reviews: [],
    tasks: seed.tasks.map((t) => (t.status === "blocked" ? { ...t, assigneeId: null } : { ...t, status: "open", assigneeId: null })),
    activity: [],
  };
}

export const appCatalog: Catalog = APP_MODE === "demo" ? seedCatalog : productionCatalog(seedCatalog);
