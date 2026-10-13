"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, SearchX } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ContributionItem, TaskRow } from "@/components/problems/shared";
import { Avatar, Container, EmptyState, Panel, SectionTitle } from "@/components/ui/misc";
import { Badge, DemoBadge, SkillTag } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Chip, Field, Textarea } from "@/components/ui/form";
import { categoryLabel } from "@/lib/domain/labels";
import { CATEGORIES, SKILLS, type CategoryId, type Skill } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";

function EditProfile({ onDone }: { onDone: () => void }) {
  const { view, dispatch } = useStore();
  const u = view.currentUser!;
  const [bio, setBio] = useState(u.bio);
  const [skills, setSkills] = useState<Skill[]>(u.skills);
  const [interests, setInterests] = useState<CategoryId[]>(u.interests);
  const save = async () => {
    const res = await dispatch({ type: "updateProfile", payload: { bio, skills, interests } });
    if (res.ok) onDone();
  };
  return (
    <Panel className="mt-6 space-y-4 p-5">
      <Field id="pf-bio" label="Bio" count={{ value: bio.length, max: 280 }}>
        <Textarea id="pf-bio" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Skills</legend>
        <div className="flex flex-wrap gap-1.5">{SKILLS.map((s) => <Chip key={s} className="text-[12px]" selected={skills.includes(s)} onToggle={() => setSkills((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))}>{s}</Chip>)}</div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Interests</legend>
        <div className="flex flex-wrap gap-1.5">{CATEGORIES.map((c) => <Chip key={c.id} className="text-[12px]" selected={interests.includes(c.id)} onToggle={() => setInterests((x) => (x.includes(c.id) ? x.filter((y) => y !== c.id) : [...x, c.id]))}>{c.label}</Chip>)}</div>
      </fieldset>
      <div className="flex gap-2"><Button onClick={save}>Save profile</Button><Button variant="ghost" onClick={onDone}>Cancel</Button></div>
    </Panel>
  );
}

export function Profile({ handle }: { handle: string }) {
  const { view, hydrated } = useStore();
  const [editing, setEditing] = useState(false);
  const u = view.users.find((x) => x.handle === handle);

  if (!u) {
    if (!hydrated) return <Container className="py-16"><div className="skeleton h-40 rounded-lg" /></Container>;
    return <Container className="py-16"><EmptyState icon={SearchX} title="Profile not found" action={<LinkButton href="/problems">Browse problems</LinkButton>}>No contributor uses this handle.</EmptyState></Container>;
  }

  const isMe = view.currentUser?.id === u.id;
  const contributions = view.contributions.filter((c) => c.authorId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const accepted = contributions.filter((c) => c.status === "accepted");
  const active = view.tasks.filter((t) => t.assigneeId === u.id && (t.status === "in_progress" || t.status === "in_review"));
  const research = contributions.filter((c) => ["analysis", "literature_review", "experiment_report", "dataset"].includes(c.kind));
  const reviewed = view.reviews.filter((r) => r.reviewerId === u.id);
  const followed = (view.follows[u.id] ?? []).map((id) => view.problems.find((p) => p.id === id)).filter((p) => !!p);
  const validatedLinked = accepted.filter((c) => view.questions.find((q) => q.id === c.questionId)?.status === "validated").length;

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-start">
        <Avatar name={u.name} size={72} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{u.name}</h1>
            {u.isDemo && <DemoBadge />}
            <Badge tone={u.role === "moderator" ? "warn" : u.role === "reviewer" ? "info" : "neutral"}>{u.role}</Badge>
          </div>
          <p className="mt-1 text-sm text-fg-subtle">@{u.handle} · joined {formatDate(u.joinedAt)}</p>
          {u.bio && <p className="mt-3 max-w-2xl text-[15px] text-fg-muted">{u.bio}</p>}
          {u.isDemo && <p className="mt-2 text-xs text-fg-subtle">This is a fictional demo profile used to illustrate the platform.</p>}
        </div>
        {isMe && !editing && <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="size-4" aria-hidden /> Edit profile</Button>}
      </div>
      {isMe && editing && <EditProfile onDone={() => setEditing(false)} />}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="pf-active">
            <SectionTitle id="pf-active" count={active.length}>Active tasks</SectionTitle>
            {active.length === 0 ? <p className="text-sm text-fg-subtle">No active tasks.</p> : <ul className="space-y-3">{active.map((t) => <TaskRow key={t.id} task={t} />)}</ul>}
          </section>
          <section aria-labelledby="pf-contribs">
            <SectionTitle id="pf-contribs" count={contributions.length}>Contributions</SectionTitle>
            {contributions.length === 0 ? <p className="text-sm text-fg-subtle">No contributions yet.</p> : <ul className="space-y-3">{contributions.map((c) => <ContributionItem key={c.id} c={c} />)}</ul>}
          </section>
          <section aria-labelledby="pf-reviewed">
            <SectionTitle id="pf-reviewed" count={reviewed.length}>Reviewed work</SectionTitle>
            {reviewed.length === 0 ? <p className="text-sm text-fg-subtle">No reviews yet.</p> : (
              <ul className="space-y-2">
                {reviewed.map((r) => {
                  const c = view.contributions.find((x) => x.id === r.contributionId);
                  return c ? (
                    <li key={r.id} className="rounded-md border border-line bg-surface px-3 py-2 text-sm">
                      <Link href={`/tasks/${c.taskId}#contributions`} className="text-fg hover:text-accent">{c.title}</Link>
                      <span className="text-xs text-fg-subtle"> · {r.decision.replace("_", " ")} · {formatDate(r.createdAt)}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </section>
        </div>
        <aside className="space-y-5">
          <Panel className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Activity vs. verified impact</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-fg-muted">Contributions submitted</dt><dd className="tabular-nums">{contributions.length}</dd></div>
              <div className="flex justify-between"><dt className="text-fg-muted">Deliverables accepted</dt><dd className="tabular-nums">{accepted.length}</dd></div>
              <div className="flex justify-between"><dt className="text-fg-muted">Negative results reported</dt><dd className="tabular-nums">{contributions.filter((c) => c.negativeResult).length}</dd></div>
              <div className="flex justify-between"><dt className="text-fg-muted">Reviews performed</dt><dd className="tabular-nums">{reviewed.length}</dd></div>
              <div className="flex justify-between border-t border-line pt-2"><dt className="text-fg-muted">Linked to validated findings</dt><dd className="tabular-nums">{validatedLinked}</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-fg-subtle">Counts describe activity, not quality. Only contributions tied to research questions that passed validation count as verified impact. There is no popularity score.</p>
          </Panel>
          <Panel className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Skills</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">{u.skills.length ? u.skills.map((s) => <SkillTag key={s}>{s}</SkillTag>) : <span className="text-sm text-fg-subtle">None listed</span>}</div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-fg-subtle">Interests</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">{u.interests.length ? u.interests.map((i) => <SkillTag key={i}>{categoryLabel(i)}</SkillTag>) : <span className="text-sm text-fg-subtle">None listed</span>}</div>
          </Panel>
          <Panel className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Submitted research</p>
            {research.length === 0 ? <p className="mt-2 text-sm text-fg-subtle">None yet.</p> : <ul className="mt-2 space-y-1.5">{research.map((c) => <li key={c.id}><Link href={`/tasks/${c.taskId}#contributions`} className="text-sm text-fg-muted hover:text-fg">{c.title}</Link></li>)}</ul>}
          </Panel>
          <Panel className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Following</p>
            {followed.length === 0 ? <p className="mt-2 text-sm text-fg-subtle">Not following any problems.</p> : <ul className="mt-2 space-y-1.5">{followed.map((p) => <li key={p.id}><Link href={`/problems/${p.slug}`} className="text-sm text-fg-muted hover:text-fg">{p.title}</Link></li>)}</ul>}
          </Panel>
        </aside>
      </div>
    </Container>
  );
}
