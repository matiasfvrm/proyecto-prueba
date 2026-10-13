"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import type { ModerationReport } from "@/lib/domain/types";

export function ReportButton({ targetType, targetId }: { targetType: ModerationReport["targetType"]; targetId: string }) {
  const { view, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ModerationReport["reason"]>("spam");
  const [details, setDetails] = useState("");
  if (!view.currentUser) return null;
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-fg">
        <Flag className="size-3" aria-hidden /> Report
      </button>
    );
  return (
    <div className="mt-2 space-y-2 rounded-md border border-line bg-bg p-3">
      <label className="block text-xs text-fg-muted" htmlFor={`rep-${targetId}`}>Reason</label>
      <Select id={`rep-${targetId}`} value={reason} onChange={(e) => setReason(e.target.value as ModerationReport["reason"])} className="h-8 text-[13px]">
        <option value="spam">Spam</option>
        <option value="harassment">Harassment or abuse</option>
        <option value="misinformation">Misleading or unsupported claims</option>
        <option value="plagiarism">Plagiarism or missing attribution</option>
        <option value="other">Other</option>
      </Select>
      <label className="sr-only" htmlFor={`rep-d-${targetId}`}>Details</label>
      <Textarea id={`rep-d-${targetId}`} rows={2} className="min-h-14 text-[13px]" placeholder="Optional details for moderators" value={details} onChange={(e) => setDetails(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" variant="danger" onClick={async () => { const r = await dispatch({ type: "report", payload: { targetType, targetId, reason, details } }); if (r.ok) setOpen(false); }}>Send report</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
