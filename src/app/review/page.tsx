import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewQueue } from "@/components/account/review-queue";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Review queue" };

export default function ReviewPage() {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-64" />}>
      <ReviewQueue />
    </Suspense>
  );
}
