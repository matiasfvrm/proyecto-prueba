# Architecture

## Goals that shaped it

1. The core workflow must work with **zero configuration** (demo mode) and **persist for real** when a database is configured.
2. Authorization rules must be **identical** wherever they run, and enforced by the server.
3. Epistemic status (what we know) and work status (what was done) must never be conflated.
4. AI must be optional and replaceable.

## Layers

```
UI (React, App Router)          components/*, app/*
  │  useStore(): view + dispatch(mutation)
Store provider                  components/providers/store-provider.tsx
  │  demo backend ──────────────► localStorage
  │  supabase backend ──────────► /api/state, /api/mutations (Bearer JWT)
API routes                      app/api/*
  │  Zod validation, rate limiting, auth
Domain (pure TypeScript)        lib/domain/*, lib/store/state.ts
  │  applyMutation(catalog, state, mutation) → new state | error
Persistence                     lib/supabase/* → PostgreSQL (RLS + SECURITY DEFINER functions)
```

### Catalog + overlay

The **catalog** (problems, questions, hypotheses, experiments, solutions, tasks, sources) is editorial content. The **user state overlay** holds everything people do: profiles, follows, task claims, contributions, reviews, submissions, proposals, reports, activity.

`buildView(catalog, state)` merges them into the `View` the UI renders: task overrides are applied, accepted submissions become problems with status `proposed` and origin `community`, accepted question proposals become questions, and activity is merged chronologically. It is pure and memoised.

### Mutations

Every state change is a member of the `mutationSchema` discriminated union (`lib/domain/schemas.ts`). The same path is used in both modes:

1. Client parses with Zod (instant feedback).
2. `POST /api/mutations`: body size limit, Zod parse, per-action rate limit.
3. Demo mode: server returns OK; the client runs `applyMutation` against its local state and persists it. Supabase mode: the server loads the user's visible state, runs `applyMutation` as a pre-check for clear error messages, then writes through RLS-constrained inserts or workflow functions, which re-check every rule atomically.

`applyMutation` never mutates its input and is covered by unit tests.

### Workflow rules (`lib/domain/workflow.ts`)

- Claim: signed in, task `open` and unassigned, not `blocked`, fewer than 3 active tasks.
- Submit: only the assignee, only while `in_progress` → task `in_review`.
- Review: reviewer or moderator, not the author, contribution `submitted`; accept requires every acceptance criterion → task `completed`; request changes → `in_progress`; reject → task reopened.
- Moderate: moderators only, never own submissions.
- Nothing in this list changes an `EvidenceStatus`.

### Graph

`lib/graph/build.ts` derives nodes and typed edges from the view (problem → cause/question/solution, question → hypothesis/task, hypothesis → experiment, task → contribution, solution → question, problem ↔ related problem). `layout.ts` runs a deterministic d3-force simulation (seeded RNG) with per-problem anchors, so positions are stable across renders and the server. React Flow renders it with custom nodes; labels collapse when zoomed out.

### AI services (`lib/ai`)

`AssistantProvider` is a one-method interface. `getAssistant()` returns the Anthropic implementation when `ANTHROPIC_API_KEY` is set, otherwise the rule-based checklist. The Anthropic provider uses structured outputs validated by Zod, low effort, server-side refusal fallback, and degrades to the checklist on any error. Only draft text is sent. To add a provider, implement the interface and select it in `lib/ai/index.ts`.

## Rendering

Pages are server components that export metadata from the catalog and render client components for interactive, state-dependent parts. Initial HTML contains the catalog content (good for SEO and no-JS reading); user state hydrates after mount. Dynamic route params are awaited per Next.js 16 conventions.

## Accessibility

Semantic landmarks, skip link, visible focus rings, ARIA tabs with arrow-key navigation, `aria-pressed` toggles, labelled form controls with error association, live regions for results and toasts, reduced-motion support for animations, keyboard-operable SVG nodes.
