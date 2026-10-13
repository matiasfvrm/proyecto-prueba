-- UNsolved initial schema.
-- Editorial catalog (problems → questions → tasks) plus user-generated records.
-- Every table has Row Level Security enabled. Workflow transitions that must be
-- atomic (claiming, submitting, reviewing, moderating) go through SECURITY DEFINER
-- functions that re-check authorization; clients cannot update those rows directly.

create extension if not exists pgcrypto;

-- ───────────────────────────── Enums ─────────────────────────────
create type evidence_status as enum ('proposed','under_investigation','evidence_submitted','under_review','validated','inconclusive');
create type task_status as enum ('open','in_progress','in_review','completed','blocked');
create type contribution_status as enum ('submitted','changes_requested','accepted','rejected');
create type contribution_kind as enum ('code','dataset','analysis','documentation','design','experiment_report','literature_review');
create type difficulty as enum ('introductory','intermediate','advanced');
create type submission_status as enum ('pending_review','accepted','rejected');
create type user_role as enum ('contributor','reviewer','moderator');
create type review_decision as enum ('accept','request_changes','reject');
create type report_reason as enum ('spam','harassment','misinformation','plagiarism','other');

-- ──────────────────────────── Catalog ────────────────────────────
create table sources (
  id text primary key,
  title text not null,
  publisher text not null,
  year int,
  url text not null check (url ~ '^https?://'),
  type text not null
);

create table problems (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 5 and 160),
  category text not null,
  summary text not null,
  why_it_matters text not null,
  definition text not null,
  difficulty difficulty not null,
  status evidence_status not null default 'proposed',
  skills text[] not null default '{}',
  causes jsonb not null default '[]',
  claims jsonb not null default '[]',      -- [{id, statement, kind, sourceIds}]
  approaches jsonb not null default '[]',
  limitations text[] not null default '{}',
  validation_criteria text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table problem_sources (
  problem_id text references problems(id) on delete cascade,
  source_id text references sources(id) on delete restrict,
  primary key (problem_id, source_id)
);

create table related_problems (
  problem_id text references problems(id) on delete cascade,
  related_id text references problems(id) on delete cascade,
  primary key (problem_id, related_id),
  check (problem_id <> related_id)
);

create table research_questions (
  id text primary key,
  problem_id text not null references problems(id) on delete cascade,
  question text not null check (question like '%?'),
  why_it_matters text not null,
  existing_knowledge text not null,
  uncertainties text[] not null default '{}',
  suggested_approaches text[] not null default '{}',
  skills text[] not null default '{}',
  status evidence_status not null default 'proposed'
);
create index on research_questions(problem_id);

create table hypotheses (
  id text primary key,
  question_id text not null references research_questions(id) on delete cascade,
  statement text not null,
  status evidence_status not null default 'proposed'
);

create table experiments (
  id text primary key,
  hypothesis_id text not null references hypotheses(id) on delete cascade,
  title text not null,
  design text not null,
  status evidence_status not null default 'proposed'
);

create table solutions (
  id text primary key,
  problem_id text not null references problems(id) on delete cascade,
  title text not null,
  summary text not null,
  status evidence_status not null default 'proposed',
  question_ids text[] not null default '{}'
);

-- ───────────────────────── Users & profiles ─────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_-]{3,24}$'),
  name text not null check (char_length(name) between 2 and 60),
  bio text not null default '' check (char_length(bio) <= 280),
  skills text[] not null default '{}' check (cardinality(skills) <= 10),
  interests text[] not null default '{}',
  role user_role not null default 'contributor',
  created_at timestamptz not null default now()
);

create table tasks (
  id text primary key,
  problem_id text not null references problems(id) on delete cascade,
  question_id text not null references research_questions(id) on delete cascade,
  title text not null,
  objective text not null,
  description text not null,
  deliverable text not null,
  skills text[] not null default '{}',
  difficulty difficulty not null,
  effort text not null,
  acceptance_criteria text[] not null check (cardinality(acceptance_criteria) > 0),
  status task_status not null default 'open',
  assignee_id uuid references profiles(id) on delete set null,
  blocked_reason text,
  updated_at timestamptz not null default now(),
  -- An open task has no assignee; work in progress or in review always has one.
  check ((status = 'open' and assignee_id is null) or status <> 'open'),
  check (status not in ('in_progress','in_review') or assignee_id is not null)
);
create index on tasks(assignee_id);
create index on tasks(question_id);

create table follows (
  user_id uuid references profiles(id) on delete cascade,
  problem_id text references problems(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references tasks(id) on delete restrict,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  summary text not null check (char_length(summary) between 20 and 2000),
  kind contribution_kind not null,
  links text[] not null default '{}' check (cardinality(links) <= 5),
  negative_result boolean not null default false,
  status contribution_status not null default 'submitted',
  hidden boolean not null default false,  -- moderation
  created_at timestamptz not null default now()
);
create index on contributions(task_id);
create index on contributions(author_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references contributions(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  decision review_decision not null,
  comment text not null check (char_length(comment) between 10 and 1500),
  criteria_met text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table problem_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 10 and 120),
  description text not null check (char_length(description) between 50 and 3000),
  why_it_matters text not null,
  category text not null,
  evidence text not null,
  existing_approaches text not null default '',
  limitations text not null default '',
  sources text[] not null check (cardinality(sources) between 1 and 10),
  research_questions text[] not null check (cardinality(research_questions) between 1 and 8),
  status submission_status not null default 'pending_review',
  decided_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table question_proposals (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null references problems(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  question text not null check (question like '%?' and char_length(question) between 15 and 240),
  rationale text not null check (char_length(rationale) between 30 and 1500),
  status submission_status not null default 'pending_review',
  decided_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('contribution','problem_submission','question_proposal','profile')),
  target_id text not null,
  reason report_reason not null,
  details text not null default '' check (char_length(details) <= 1000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table activity (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor_id uuid not null references profiles(id) on delete cascade,
  problem_id text not null references problems(id) on delete cascade,
  type text not null,
  target_id text not null,
  message text not null check (char_length(message) <= 400)
);
create index on activity(problem_id, at desc);

-- ───────────────────────────── Helpers ─────────────────────────────
create or replace function current_role_of(uid uuid) returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = uid
$$;

-- Users may edit their own profile but never their own role.
-- auth.role() is null for direct SQL sessions (migrations, admin scripts), which may change roles.
create or replace function protect_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), 'service_role') <> 'service_role' then
    raise exception 'role can only be changed by an administrator';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on profiles for each row execute function protect_profile_role();

create or replace function force_contributor_role() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), 'service_role') <> 'service_role' then
    new.role := 'contributor';
  end if;
  return new;
end $$;
create trigger profiles_force_role before insert on profiles for each row execute function force_contributor_role();

-- ─────────────────────── Workflow functions ───────────────────────
create or replace function claim_task(p_task_id text) returns void
language plpgsql security definer set search_path = public as $$
declare t tasks; active int;
begin
  if auth.uid() is null or not exists (select 1 from profiles where id = auth.uid()) then raise exception 'profile required'; end if;
  select * into t from tasks where id = p_task_id for update;
  if not found then raise exception 'task not found'; end if;
  if t.status <> 'open' or t.assignee_id is not null then raise exception 'task is not open for claiming'; end if;
  select count(*) into active from tasks where assignee_id = auth.uid() and status in ('in_progress','in_review');
  if active >= 3 then raise exception 'active task limit reached'; end if;
  update tasks set status = 'in_progress', assignee_id = auth.uid(), updated_at = now() where id = p_task_id;
  insert into activity(actor_id, problem_id, type, target_id, message)
    values (auth.uid(), t.problem_id, 'task_claimed', t.id, left('Claimed “' || t.title || '”', 400));
end $$;

create or replace function release_task(p_task_id text) returns void
language plpgsql security definer set search_path = public as $$
declare t tasks;
begin
  select * into t from tasks where id = p_task_id for update;
  if not found or t.assignee_id is distinct from auth.uid() or t.status <> 'in_progress' then raise exception 'cannot release this task'; end if;
  update tasks set status = 'open', assignee_id = null, updated_at = now() where id = p_task_id;
  insert into activity(actor_id, problem_id, type, target_id, message)
    values (auth.uid(), t.problem_id, 'task_released', t.id, left('Released “' || t.title || '”', 400));
end $$;

create or replace function submit_contribution(p_task_id text, p_title text, p_summary text, p_kind contribution_kind, p_links text[], p_negative boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare t tasks; new_id uuid; l text;
begin
  select * into t from tasks where id = p_task_id for update;
  if not found or t.assignee_id is distinct from auth.uid() or t.status <> 'in_progress' then raise exception 'claim this task before submitting'; end if;
  foreach l in array coalesce(p_links, '{}') loop
    if l !~ '^https?://' then raise exception 'invalid link'; end if;
  end loop;
  insert into contributions(task_id, author_id, title, summary, kind, links, negative_result)
    values (p_task_id, auth.uid(), p_title, p_summary, p_kind, coalesce(p_links, '{}'), p_negative) returning id into new_id;
  update tasks set status = 'in_review', updated_at = now() where id = p_task_id;
  insert into activity(actor_id, problem_id, type, target_id, message)
    values (auth.uid(), t.problem_id, 'contribution_submitted', new_id::text, left('Submitted “' || p_title || '”', 400));
  return new_id;
end $$;

-- Accepting a deliverable completes the task. It never changes any evidence_status.
create or replace function review_contribution(p_contribution_id uuid, p_decision review_decision, p_comment text, p_criteria text[])
returns void language plpgsql security definer set search_path = public as $$
declare c contributions; t tasks; r user_role;
begin
  r := current_role_of(auth.uid());
  if r is null or r = 'contributor' then raise exception 'only reviewers can review'; end if;
  select * into c from contributions where id = p_contribution_id for update;
  if not found or c.status <> 'submitted' then raise exception 'contribution is not awaiting review'; end if;
  if c.author_id = auth.uid() then raise exception 'cannot review own contribution'; end if;
  select * into t from tasks where id = c.task_id for update;
  if p_decision = 'accept' and not (t.acceptance_criteria <@ coalesce(p_criteria, '{}')) then
    raise exception 'all acceptance criteria must be met to accept';
  end if;
  insert into reviews(contribution_id, reviewer_id, decision, comment, criteria_met)
    values (c.id, auth.uid(), p_decision, p_comment, coalesce(p_criteria, '{}'));
  update contributions set status = case p_decision when 'accept' then 'accepted'::contribution_status
    when 'request_changes' then 'changes_requested'::contribution_status else 'rejected'::contribution_status end
    where id = c.id;
  update tasks set
    status = case p_decision when 'accept' then 'completed'::task_status when 'request_changes' then 'in_progress'::task_status else 'open'::task_status end,
    assignee_id = case when p_decision = 'reject' then null else assignee_id end,
    updated_at = now()
    where id = t.id;
  insert into activity(actor_id, problem_id, type, target_id, message)
    values (auth.uid(), t.problem_id, 'contribution_reviewed', c.id::text, left('Reviewed “' || c.title || '”', 400));
end $$;

create or replace function moderate_submission(p_target text, p_id uuid, p_decision submission_status)
returns void language plpgsql security definer set search_path = public as $$
declare author uuid; st submission_status;
begin
  if current_role_of(auth.uid()) is distinct from 'moderator' then raise exception 'only moderators can moderate'; end if;
  if p_decision = 'pending_review' then raise exception 'invalid decision'; end if;
  if p_target = 'problem_submission' then
    select author_id, status into author, st from problem_submissions where id = p_id for update;
  elsif p_target = 'question_proposal' then
    select author_id, status into author, st from question_proposals where id = p_id for update;
  else raise exception 'invalid target'; end if;
  if author is null then raise exception 'submission not found'; end if;
  if author = auth.uid() then raise exception 'cannot moderate own submission'; end if;
  if st <> 'pending_review' then raise exception 'already decided'; end if;
  if p_target = 'problem_submission' then
    update problem_submissions set status = p_decision, decided_by = auth.uid() where id = p_id;
  else
    update question_proposals set status = p_decision, decided_by = auth.uid() where id = p_id;
  end if;
end $$;

revoke all on function claim_task, release_task, submit_contribution, review_contribution, moderate_submission from public, anon;
grant execute on function claim_task, release_task, submit_contribution, review_contribution, moderate_submission to authenticated;

-- ──────────────────────── Row Level Security ────────────────────────
alter table sources enable row level security;
alter table problems enable row level security;
alter table problem_sources enable row level security;
alter table related_problems enable row level security;
alter table research_questions enable row level security;
alter table hypotheses enable row level security;
alter table experiments enable row level security;
alter table solutions enable row level security;
alter table tasks enable row level security;
alter table profiles enable row level security;
alter table follows enable row level security;
alter table contributions enable row level security;
alter table reviews enable row level security;
alter table problem_submissions enable row level security;
alter table question_proposals enable row level security;
alter table reports enable row level security;
alter table activity enable row level security;

-- Catalog: public read; writes only by service role (no policies = denied).
create policy "catalog read" on sources for select using (true);
create policy "catalog read" on problems for select using (true);
create policy "catalog read" on problem_sources for select using (true);
create policy "catalog read" on related_problems for select using (true);
create policy "catalog read" on research_questions for select using (true);
create policy "catalog read" on hypotheses for select using (true);
create policy "catalog read" on experiments for select using (true);
create policy "catalog read" on solutions for select using (true);
create policy "catalog read" on tasks for select using (true);   -- updates only via functions

create policy "profiles are public" on profiles for select using (true);
create policy "create own profile" on profiles for insert with check (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "own follows" on follows for select using (user_id = auth.uid());
create policy "follow" on follows for insert with check (user_id = auth.uid());
create policy "unfollow" on follows for delete using (user_id = auth.uid());

create policy "visible contributions" on contributions for select
  using (not hidden or author_id = auth.uid() or current_role_of(auth.uid()) = 'moderator');
-- Inserts and status changes only via submit_contribution / review_contribution.

create policy "reviews are public" on reviews for select using (true);

create policy "read submissions" on problem_submissions for select
  using (status = 'accepted' or author_id = auth.uid() or current_role_of(auth.uid()) = 'moderator');
create policy "submit problem" on problem_submissions for insert
  with check (author_id = auth.uid() and status = 'pending_review' and decided_by is null);

create policy "read proposals" on question_proposals for select
  using (status = 'accepted' or author_id = auth.uid() or current_role_of(auth.uid()) = 'moderator');
create policy "propose question" on question_proposals for insert
  with check (author_id = auth.uid() and status = 'pending_review' and decided_by is null);

create policy "read own or moderate reports" on reports for select
  using (reporter_id = auth.uid() or current_role_of(auth.uid()) = 'moderator');
create policy "file report" on reports for insert with check (reporter_id = auth.uid());

create policy "activity is public" on activity for select using (true);
create policy "log own activity" on activity for insert with check (actor_id = auth.uid());
