"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useStore, IS_DEMO } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";

export function ResetDemo() {
  const { resetDemo } = useStore();
  const [confirming, setConfirming] = useState(false);
  if (!IS_DEMO) return <p>This instance is connected to a database; there is no local demo data to reset.</p>;
  return confirming ? (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-sm">This removes your local profile and all actions stored in this browser.</span>
      <Button variant="danger" size="sm" onClick={() => { resetDemo(); setConfirming(false); }}>Reset now</Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
    </span>
  ) : (
    <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}><RotateCcw className="size-3.5" aria-hidden /> Reset demo data</Button>
  );
}
