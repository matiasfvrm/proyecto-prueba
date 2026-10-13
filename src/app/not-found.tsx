import { SearchX } from "lucide-react";
import { Container, EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-20">
      <EmptyState icon={SearchX} title="Page not found" action={<LinkButton href="/problems">Explore problems</LinkButton>}>
        The page you are looking for does not exist or has moved.
      </EmptyState>
    </Container>
  );
}
