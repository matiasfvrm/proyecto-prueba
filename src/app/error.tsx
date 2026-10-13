"use client";

import { AlertTriangle } from "lucide-react";
import { Container, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-20">
      <EmptyState icon={AlertTriangle} title="Something went wrong" action={<Button onClick={reset}>Try again</Button>}>
        An unexpected error occurred while loading this page. If it keeps happening, please report it from the contact page.
      </EmptyState>
    </Container>
  );
}
