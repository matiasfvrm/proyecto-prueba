# Roadmap

Priorities, roughly in order. Each item should keep the core principles: evidence carries its status, AI stays optional, no popularity metrics.

## Near term (v0.2)
- Catalog editing for maintainers: create/edit problems, questions, tasks and hypotheses through the UI, with revision history.
- Evidence validation workflow: multi-reviewer sign-off against each validation criterion before any status can become *Validated*; revisiting validations.
- Moderation tools: hide/restore contributions, resolve reports, audit log.
- Run the Playwright suite against a local Supabase stack in CI.

## Mid term
- Load the catalog from the database (bundled catalog becomes seed only); pagination and server-side search.
- Markdown with sanitisation for summaries and protocols.
- Notifications for followed problems and review outcomes.
- Shared rate limiting (Redis/Upstash).
- Internationalisation (Spanish first).

## AI services (optional, behind the provider interface)
- Question decomposition suggestions for new problems.
- Literature-review drafts that only cite documents the user supplies or that are retrieved with verifiable links; every citation traceable.
- Semantic duplicate detection.
- Experiment and validation-method suggestions, always labeled unverified.

## Later
- Public read API and data export (JSON-LD) for the knowledge graph.
- Organisation spaces for NGOs and research groups.
- Reproducibility starter kits attached to experiment tasks.
