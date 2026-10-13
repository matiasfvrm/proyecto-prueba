import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@/components/account/signin";
import { SupabaseSignIn } from "@/components/account/supabase-signin";
import { Container, PageHeader, Skeleton } from "@/components/ui/misc";
import { APP_MODE } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Container className="py-12">
      <PageHeader
        eyebrow="Account"
        title="Sign in"
        description={
          APP_MODE === "demo"
            ? "This instance runs in demo mode. Choose a demo profile or create a local profile — everything stays in this browser."
            : "We will email you a one-time sign-in link."
        }
      />
      <Suspense fallback={<Skeleton className="mt-8 h-96" />}>{APP_MODE === "demo" ? <SignIn /> : <SupabaseSignIn />}</Suspense>
    </Container>
  );
}
