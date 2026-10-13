# Database

Schema: `supabase/migrations/20261013000000_init.sql`. Seed: `supabase/seed.sql` (generated — run `npm run db:seed-sql` after editing `src/lib/data/seed`).

## Tables

| Table | Purpose | Key constraints |
|---|---|---|
| `sources` | External references | URL must be http(s) |
| `problems` | Catalog problems; causes/claims/approaches as JSONB | unique slug pattern, title length |
| `problem_sources`, `related_problems` | Many-to-many links | no self-relations |
| `research_questions` | Questions per problem | text must end with `?` |
| `hypotheses`, `experiments`, `solutions` | Research structure | FK cascade from parents |
| `tasks` | Work items | ≥1 acceptance criterion; open ⇔ unassigned; in progress/review ⇒ assigned |
| `profiles` | Public profile per `auth.users` row | handle pattern, bio ≤ 280, role enum |
| `follows` | User ↔ problem | composite PK |
| `contributions` | Submitted work | title/summary lengths, ≤5 links, `hidden` for moderation |
| `reviews` | Decisions on contributions | comment length |
| `problem_submissions`, `question_proposals` | Moderated user proposals | status enum, length checks |
| `reports` | Abuse reports | target type enum |
| `activity` | Public activity log | message ≤ 400 |

## Row Level Security

| Data | Read | Write |
|---|---|---|
| Catalog | everyone | service role only |
| Tasks | everyone | only via `claim_task`, `release_task`, `submit_contribution`, `review_contribution` |
| Profiles | everyone | own row; role cannot be set or changed by users (triggers) |
| Follows | owner | owner |
| Contributions | everyone (hidden ones: author + moderators) | only via `submit_contribution` / `review_contribution` |
| Reviews, activity | everyone | via functions; activity inserts must be by the actor |
| Submissions / proposals | accepted: everyone; pending: author + moderators | author inserts as `pending_review`; decisions via `moderate_submission` |
| Reports | reporter + moderators | reporter inserts |

## Workflow functions

All are `SECURITY DEFINER` with a fixed `search_path`, lock the affected rows (`FOR UPDATE`) and re-check authorization:

- `claim_task(task_id)` — open + unassigned, max 3 active tasks per user.
- `release_task(task_id)` — assignee only, while in progress.
- `submit_contribution(...)` — assignee only, http(s) links only → task in review.
- `review_contribution(id, decision, comment, criteria)` — reviewer/moderator, not the author; accept requires every acceptance criterion. Never touches evidence status.
- `moderate_submission(target, id, decision)` — moderator, not the author, pending only.

Execution is revoked from `anon`.

## Testing

`scripts/test-db.sh` applies a minimal Supabase `auth` stub (`tests/db/auth-stub.sql`), the migration, default grants and the seed to a scratch database, then runs `tests/db/workflow-test.sql`. Each negative case asserts the specific error message.

```bash
createdb unsolved_test
DATABASE_URL=postgresql://localhost/unsolved_test scripts/test-db.sh
```
