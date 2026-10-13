# UNsolved

**An open platform for turning humanity's unsolved problems into collaborative, measurable progress.**

UNsolved gives hard problems a shared structure so many people can contribute careful, verifiable work:

```
Problem → Evidence → Research questions → Tasks → Contributions → Validation → Documented outcomes
```

Every claim carries an explicit status (documented in sources, hypothesis, unverified proposal, supported by validated evidence). Every record is a node in a knowledge graph. Completing a task is never confused with validating a claim.

> **Status: v0.1, early.** The core workflow works end to end. Demo content is illustrative. See [Limitations](#limitations) and the [roadmap](docs/ROADMAP.md).

---

## What you can do

| Area | What works |
|---|---|
| **Landing page** | Interactive problem map (hero), live problem previews, how it works, explorable mini-graph, evidence-status ladder |
| **Discover** (`/problems`) | Keyword search, filters for category, evidence status, difficulty, skills and recent activity; sort by relevance, recency or open tasks; shareable URLs; empty/loading states |
| **Problem pages** | Overview (why it matters, definition, causes, approaches, limitations, related problems, activity), Research questions, Tasks (status filter), Contributions, Evidence (labeled claims, validation criteria, solutions, hypotheses/experiments, sources) |
| **Research questions** | Existing knowledge, uncertainties, approaches, hypotheses and experiments, tasks, submitted evidence; propose new questions (moderated) |
| **Tasks** | Objective, deliverable, acceptance criteria, difficulty, effort; claim / release; submit contributions (incl. negative results); independent review against each criterion |
| **Problem graph** (`/graph`) | React Flow graph of problems, causes, questions, hypotheses, experiments, tasks, contributions and solutions; zoom/pan, type filters, search, neighbour highlighting, inspector, deep links (`/graph?focus=<id>`) |
| **Profiles** | Skills, interests, active tasks, contributions, reviewed work, followed problems; activity kept separate from verified impact; no popularity score |
| **Submit a problem** | Validated form, live duplicate detection (keyword similarity), optional draft checker (rule-based, or AI when configured), moderation queue |
| **Dashboard** | Followed problems, current tasks, review requests, recent contributions, related problems, explainable task suggestions, next actions |
| **Review queue** | Contribution reviews (reviewers), problem/question moderation and abuse reports (moderators) |

## Quick start

Requirements: Node.js ≥ 20.9 (22 recommended, see `.nvmrc`).

```bash
git clone https://github.com/matiasfvrm/proyecto-prueba.git unsolved
cd unsolved
npm install
npm run dev
```

Open http://localhost:3000. With no configuration the app runs in **demo mode**:

- Seven illustrative problems with research questions, tasks, hypotheses and real public source links.
- Six fictional demo profiles (clearly labeled) with different roles. Sign in as one from `/signin` to try the full flow: claim a task as **Lucas** (contributor), review it as **Mei** or **Amara** (reviewers), moderate submissions as **Sofía** (moderator).
- Every action is validated and rate-limited by the server, then stored **only in your browser** (localStorage). Nothing is shared between visitors. Reset from `/docs#reset`.

## Configuration

Copy `.env.example` to `.env.local`. All variables are optional.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL for metadata and sitemap |
| `NEXT_PUBLIC_REPO_URL` | public | Source link in the footer (required by AGPL §13 for hosted instances) |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Enables Supabase mode (shared persistence, email sign-in) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (safe in the browser; RLS protects data) |
| `ANTHROPIC_API_KEY` | **server only** | Enables the AI draft checker. Never exposed to the client |
| `ANTHROPIC_MODEL` | server only | Optional model override (default `claude-opus-5-5`) |

The Supabase **service-role key is not used** by the application and must never be added to client code. Details: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

### Supabase mode

1. Create a Supabase project and enable the Email provider (magic links).
2. Apply `supabase/migrations/*.sql`, then `supabase/seed.sql` (SQL editor or `supabase db push`).
3. Set the two `NEXT_PUBLIC_SUPABASE_*` variables and add `<site>/signin` to the allowed redirect URLs.
4. Promote reviewers/moderators from the SQL editor: `update profiles set role = 'reviewer' where handle = '…';`

In Supabase mode the demo profiles and their activity are hidden; the editorial catalog is still bundled with the app (see Limitations). Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (domain rules, validation, filters, seed integrity, graph) |
| `npm run test:e2e` | Playwright end-to-end tests (builds and starts the app on port 3100) |
| `npm run db:seed-sql` | Regenerates `supabase/seed.sql` from the TypeScript catalog |
| `DATABASE_URL=… scripts/test-db.sh` | Applies migration + seed to a scratch PostgreSQL database and runs the RLS/workflow assertions |

## Architecture

```
src/
  app/                    Next.js App Router pages and API routes
    api/mutations         Single validated, rate-limited write endpoint
    api/state             Shared state (Supabase mode)
    api/assist/proposal   Draft checker (rule-based or AI)
  components/             UI by feature (landing, problems, graph, tasks, forms, account, ui)
  lib/
    domain/               Types, Zod schemas, workflow rules, filters, recommendations, similarity
    data/seed/            Illustrative catalog (one file per problem) and real sources
    store/                Pure state layer: applyMutation(), buildView()
    graph/                Graph construction and deterministic force layout
    ai/                   Assistant provider interface, rule-based and Anthropic implementations
    supabase/             Browser client, server adapter, state loader
    server/               Rate limiting
supabase/migrations       Schema, constraints, RLS policies, workflow functions
tests/unit | e2e | db     Vitest, Playwright, SQL tests
```

Key design decisions are explained in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the data model in [docs/DATABASE.md](docs/DATABASE.md).

## Security

- All writes go through `POST /api/mutations`, validated with Zod on the server (length limits, control-character stripping, http(s)-only links, strict identifiers) and rate-limited per IP and action.
- Authorization rules live in pure functions (`src/lib/domain/workflow.ts`) shared by client and server; in Supabase mode the database enforces them again with RLS and `SECURITY DEFINER` functions (no self-review, no self-moderation, no role escalation, atomic claims).
- User content is rendered as text (no HTML injection); external links use `rel="noopener noreferrer nofollow ugc"`.
- Security headers are set in `next.config.ts`. Secrets are server-only environment variables.
- Abuse reporting on contributions; moderators see reports in the review queue.

Report vulnerabilities privately: [SECURITY.md](SECURITY.md).

## AI features

AI is optional. The platform is fully usable without it, and nothing pretends to be AI when it isn't:

- **Task suggestions** are rule-based and explain themselves ("Suggested because it matches your skills Python…").
- **Duplicate detection** is keyword similarity computed in the browser.
- **Draft checker**: with `ANTHROPIC_API_KEY` set, the server sends only the draft text (never user identity) to Claude through a replaceable provider interface (`src/lib/ai/types.ts`). Output is structured, labeled "AI-generated — unverified", and the prompt forbids supplying citations. Without a key, or on any error or refusal, a deterministic checklist runs instead and the UI says so.
- Generated content is never executed.

## Testing

- **Unit (30 tests):** workflow state machine, authorization rules, input validation, filters and URL state, recommendations, duplicate detection, rate limiting, seed-data integrity (no validated claims in demo data, every documented claim cites a source, graph consistency).
- **End-to-end (41 tests, desktop + mobile):** every page renders without console errors or horizontal overflow; search/filters; problem tabs; claim → submit → review with persistence across reload; submission → moderation → publication as “Proposed”; follow → dashboard; profile creation; graph search/inspect/navigate.
- **Database:** `tests/db/workflow-test.sql` runs against real PostgreSQL with a Supabase `auth` stub and asserts RLS and workflow rules (role escalation, direct writes, self-review, self-moderation, privacy of follows and reports, anonymous writes).

## Limitations

Honest list of what v0.1 does not do yet:

- **Catalog is bundled.** Problems, questions, tasks and sources are TypeScript files, mirrored into the database by `npm run db:seed-sql`. Accepted community submissions become live problems, but maintainers cannot yet edit the catalog through the UI, and new tasks/hypotheses are added in code.
- **Supabase mode is verified at the database level only.** The SQL (schema, RLS, functions, seed) is tested on PostgreSQL 16 with an auth stub; the TypeScript adapter typechecks but has not been exercised against a live Supabase project in CI.
- **Evidence status changes** (e.g. marking a question *validated*) have no UI workflow yet; they are deliberately manual until a multi-reviewer validation process is designed.
- **Rate limiting is in-memory** (per instance). Use a shared store for multi-instance deployments.
- **State loading is bounded**, not paginated (Supabase mode loads up to ~1–2k recent records per type).
- **No rich text**: summaries are plain text by design (safer); Markdown rendering with sanitization is on the roadmap.
- **Moderation is basic**: reports are listed for moderators; hiding content is supported in the schema (`contributions.hidden`) but not yet in the UI.
- **English only**.

## Contributing

Contributions of all kinds are welcome — code, design, documentation, and well-researched problem content. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

**Goals:** structure over volume; evidence over assertion; welcoming to non-experts without lowering standards; open data and open code; AI as an optional assistant, never an authority.

**Non-goals:** social feeds or popularity metrics; generic project management; claiming problems are "solved" without validated evidence; an AI chatbot.

## License

Code: **GNU AGPL-3.0-or-later** ([LICENSE](LICENSE)). Written content contributions: **CC BY 4.0**. Why copyleft for this project, and the trade-offs versus permissive licenses: [docs/LICENSING.md](docs/LICENSING.md).
