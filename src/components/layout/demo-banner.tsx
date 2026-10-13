"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { IS_DEMO } from "@/components/providers/store-provider";

export function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="border-b border-line bg-surface">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs text-fg-muted">
        <FlaskConical className="size-3.5 shrink-0 text-amber-300" aria-hidden />
        <span>
          <strong className="font-medium text-fg">Demo mode.</strong> Problems and profiles are illustrative. Your actions are saved only in this browser, not in a shared database.{" "}
          <Link href="/about#demo-mode" className="text-accent underline-offset-2 hover:underline">
            Learn more
          </Link>
        </span>
      </p>
    </div>
  );
}
