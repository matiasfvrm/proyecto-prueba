# Contributing to UNsolved

Thank you for helping. There are two ways to contribute:

1. **On the platform** — research, analysis, writing, design and reviews. See the in-app contribution guidelines at `/guidelines` (source: `src/app/guidelines/page.tsx`).
2. **To the software** — this repository. The rest of this file is about that.

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000, demo mode
```

Before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e       # builds and serves on :3100
```

If you change SQL, also run `scripts/test-db.sh` against a scratch PostgreSQL database (see docs/DATABASE.md). If you change demo content in `src/lib/data/seed`, run `npm run db:seed-sql` and commit the regenerated `supabase/seed.sql`.

## Ground rules

- **Never weaken evidence labelling.** Nothing may mark a claim, question or solution as validated automatically. Completing tasks must not change evidence status.
- **Demo content must stay honest.** No invented findings, figures, citations or impact claims. Only link sources you have checked exist. Demo profiles must be labeled.
- **Rules live in `src/lib/domain/workflow.ts`** and are mirrored in SQL. Change both, and add tests for both.
- **All writes go through the mutation schema.** Add a new mutation type to `mutationSchema`, `applyMutation`, and the Supabase adapter.
- **No secrets in client code.** Anything prefixed `NEXT_PUBLIC_` is public.
- **Accessibility is not optional.** Keyboard operable, labelled controls, visible focus.
- Keep dependencies few and well-maintained. Explain new ones in the PR.

## Style

TypeScript strict mode, functional React components, Tailwind utilities with the tokens in `globals.css`, Lucide icons. Match the surrounding code. Prefer small, pure functions in `lib/` with unit tests over logic in components.

## Commits and pull requests

- One logical change per PR; fill in the PR template.
- Describe user-visible changes and how you tested them. Include screenshots for UI changes.
- By contributing you agree that your code is licensed under AGPL-3.0-or-later and written content under CC BY 4.0.

## Reporting issues

Use the issue templates. For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

Everyone participating is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
