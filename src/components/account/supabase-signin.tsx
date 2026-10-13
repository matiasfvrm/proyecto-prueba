"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { z } from "zod";
import { getBrowserClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/misc";

const emailSchema = z.email("Enter a valid email address.");

export function SupabaseSignIn() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    const supabase = getBrowserClient();
    if (!supabase) return setError("Authentication is not configured.");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <Panel className="mt-8 max-w-md p-6">
      {sent ? (
        <div className="flex gap-3">
          <MailCheck className="size-5 shrink-0 text-accent" aria-hidden />
          <p className="text-sm text-fg-muted">Check <strong className="text-fg">{email}</strong> for a sign-in link. You can close this tab.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field id="email" label="Email" required error={error}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
          </Field>
          <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</Button>
        </form>
      )}
    </Panel>
  );
}
