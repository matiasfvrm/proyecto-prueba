"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, SearchX } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ProblemCard } from "./problem-card";
import { Chip, Input, Select } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import {
  DEFAULT_FILTERS,
  filterProblems,
  filtersFromSearchParams,
  filtersToSearchParams,
  type DiscoverFilters,
} from "@/lib/domain/discover";
import { CATEGORIES, DIFFICULTIES, EVIDENCE_STATUSES, SKILLS } from "@/lib/domain/types";
import { DIFFICULTY_META, EVIDENCE_STATUS_META } from "@/lib/domain/labels";
import { cn } from "@/lib/utils";

type ListKey = "categories" | "difficulties" | "skills" | "statuses";

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line pb-5 last:border-0">
      <legend className="mb-2.5 text-xs font-medium uppercase tracking-wider text-fg-subtle">{title}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

export function Discover() {
  const { view } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [filters, setFilters] = useState<DiscoverFilters>(() => filtersFromSearchParams(new URLSearchParams(params.toString())));
  const [query, setQuery] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Debounce the keyword input.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === query ? f : { ...f, q: query })), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Keep the URL shareable.
  useEffect(() => {
    const qs = filtersToSearchParams(filters).toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }, [filters, pathname, router]);

  const results = useMemo(() => filterProblems(view, filters), [view, filters]);
  const set = (patch: Partial<DiscoverFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggleIn = (key: ListKey, v: string) => setFilters((f) => ({ ...f, [key]: toggle(f[key] as string[], v) }));
  const activeCount = filters.categories.length + filters.difficulties.length + filters.skills.length + filters.statuses.length + (filters.activity !== "any" ? 1 : 0);
  const reset = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
  };

  const panel = (
    <div className="space-y-5">
      <FilterGroup title="Category">
        {CATEGORIES.map((c) => (
          <Chip key={c.id} selected={filters.categories.includes(c.id)} onToggle={() => toggleIn("categories", c.id)}>
            {c.label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Evidence status">
        {EVIDENCE_STATUSES.map((s) => (
          <Chip key={s} selected={filters.statuses.includes(s)} onToggle={() => toggleIn("statuses", s)}>
            {EVIDENCE_STATUS_META[s].label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Difficulty">
        {DIFFICULTIES.map((d) => (
          <Chip key={d} selected={filters.difficulties.includes(d)} onToggle={() => toggleIn("difficulties", d)}>
            {DIFFICULTY_META[d].label}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Required skills">
        {SKILLS.map((s) => (
          <Chip key={s} selected={filters.skills.includes(s)} onToggle={() => toggleIn("skills", s)} className="text-[12px]">
            {s}
          </Chip>
        ))}
      </FilterGroup>
      <FilterGroup title="Activity">
        {([["any", "Any time"], ["7d", "Past 7 days"], ["30d", "Past 30 days"]] as const).map(([v, l]) => (
          <Chip key={v} selected={filters.activity === v} onToggle={() => set({ activity: v })}>
            {l}
          </Chip>
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2">
          {panel}
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={reset} className="mt-2">
              <X className="size-3.5" aria-hidden /> Clear all filters
            </Button>
          )}
        </div>
      </aside>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <label htmlFor="discover-search" className="sr-only">
              Search problems
            </label>
            <Input
              id="discover-search"
              type="search"
              placeholder="Search problems, questions and skills…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <label htmlFor="discover-sort" className="sr-only">
              Sort by
            </label>
            <Select id="discover-sort" value={filters.sort} onChange={(e) => set({ sort: e.target.value as DiscoverFilters["sort"] })} className="sm:w-48">
              <option value="relevance">Sort: Relevance</option>
              <option value="updated">Sort: Recently updated</option>
              <option value="open_tasks">Sort: Most open tasks</option>
            </Select>
            <Button variant="secondary" className="lg:hidden" aria-expanded={showFilters} aria-controls="mobile-filters" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters{activeCount > 0 && ` (${activeCount})`}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div id="mobile-filters" className="mt-4 rounded-lg border border-line bg-surface p-4 lg:hidden">
            {panel}
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => setShowFilters(false)}>Show {results.length} results</Button>
              {activeCount > 0 && <Button variant="ghost" size="sm" onClick={reset}>Clear all</Button>}
            </div>
          </div>
        )}

        <p className={cn("mt-5 text-sm text-fg-muted transition-opacity", isPending && "opacity-60")} aria-live="polite">
          {results.length} {results.length === 1 ? "problem" : "problems"}
          {activeCount + (filters.q ? 1 : 0) > 0 && " match your filters"}
        </p>

        {results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No problems match these filters"
            className="mt-4"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={reset}>Clear filters</Button>
                <LinkButton href="/submit" variant="ghost">Submit a problem</LinkButton>
              </div>
            }
          >
            Try fewer filters or a broader keyword. If the problem you have in mind is missing, you can propose it for review.
          </EmptyState>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map(({ problem, stats }) => (
              <li key={problem.id}>
                <ProblemCard problem={problem} stats={stats} headingLevel="h2" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
