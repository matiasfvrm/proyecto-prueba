"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/components/providers/store-provider";
import { Avatar, Panel } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Chip, Field, Input, Textarea } from "@/components/ui/form";
import { DemoBadge, Badge } from "@/components/ui/badge";
import { fieldErrors, profileInputSchema } from "@/lib/domain/schemas";
import { CATEGORIES, SKILLS, type CategoryId, type Skill } from "@/lib/domain/types";

export function safeNext(next: string | null): string {
  // Only allow same-origin relative paths to prevent open redirects.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function CreateProfileForm({ onCreated, description }: { onCreated: () => void; description: string }) {
  const { dispatch } = useStore();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<CategoryId[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileInputSchema.safeParse({ name, handle, bio, skills, interests });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const res = await dispatch({ type: "createProfile", payload: parsed.data });
    setBusy(false);
    if (res.ok) onCreated();
    else if (res.fieldErrors) setErrors(res.fieldErrors);
    else setErrors({ handle: res.error });
  };

  return (
    <Panel className="p-5">
      <h2 id="create-title" className="text-[15px] font-semibold">Create your profile</h2>
      <p className="mt-1 text-sm text-fg-muted">{description}</p>
      <form onSubmit={create} noValidate className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="su-name" label="Display name" required error={errors.name}>
            <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoComplete="nickname" />
          </Field>
          <Field id="su-handle" label="Handle" required error={errors.handle} hint="Lowercase letters, numbers, - or _">
            <Input id="su-handle" value={handle} onChange={(e) => setHandle(e.target.value)} aria-invalid={!!errors.handle} autoComplete="username" />
          </Field>
        </div>
        <Field id="su-bio" label="Short bio" error={errors.bio} count={{ value: bio.length, max: 280 }}>
          <Textarea id="su-bio" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-16" />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Skills <span className="font-normal text-fg-subtle">— used to suggest tasks</span></legend>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => <Chip key={s} className="text-[12px]" selected={skills.includes(s)} onToggle={() => setSkills((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))}>{s}</Chip>)}
          </div>
          {errors.skills && <p className="mt-1 text-xs text-rose-300">{errors.skills}</p>}
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Interests</legend>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => <Chip key={c.id} className="text-[12px]" selected={interests.includes(c.id)} onToggle={() => setInterests((x) => (x.includes(c.id) ? x.filter((y) => y !== c.id) : [...x, c.id]))}>{c.label}</Chip>)}
          </div>
        </fieldset>
        <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create profile and sign in"}</Button>
      </form>
    </Panel>
  );
}

export function SignIn() {
  const { view, signIn } = useStore();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const demoUsers = view.users.filter((u) => u.isDemo);
  const localUsers = view.users.filter((u) => !u.isDemo);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="demo-title">
        <h2 id="demo-title" className="text-[15px] font-semibold">Continue as a demo profile</h2>
        <p className="mt-1 text-sm text-fg-muted">Fictional profiles with different roles, so you can try the full workflow: claim a task as a contributor, review as a reviewer, accept submissions as a moderator.</p>
        <ul className="mt-4 space-y-2">
          {[...localUsers, ...demoUsers].map((u) => (
            <li key={u.id}>
              <button
                onClick={() => {
                  signIn(u.id);
                  router.push(next);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <Avatar name={u.name} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium text-fg">
                    {u.name} {u.isDemo ? <DemoBadge /> : <Badge tone="accent">Your local profile</Badge>}
                  </span>
                  <span className="block truncate text-xs text-fg-subtle">{u.skills.slice(0, 3).join(" · ")}</span>
                </span>
                <Badge tone={u.role === "moderator" ? "warn" : u.role === "reviewer" ? "info" : "neutral"}>{u.role}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="create-title">
        <CreateProfileForm onCreated={() => router.push(next)} description="Stored only in this browser. No email or password is collected in demo mode." />
      </section>
    </div>
  );
}
