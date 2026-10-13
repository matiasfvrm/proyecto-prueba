# Deployment

## Demo deployment (no database)

Any Node.js host that runs Next.js works (Vercel, Netlify, Fly.io, a container):

```bash
npm ci
npm run build
npm start          # PORT env var or -p to choose a port
```

Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_REPO_URL`. The demo banner tells visitors their actions stay in their browser.

## With Supabase

1. Create a project. In **Authentication → Providers**, enable Email (magic link). Add `https://<your-site>/signin` to **Redirect URLs**.
2. Apply the schema and seed — SQL editor (paste the migration, then `supabase/seed.sql`) or the CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
   ```
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the host's environment and redeploy.
4. Sign in once, create your profile, then promote yourself in the SQL editor:
   ```sql
   update profiles set role = 'moderator' where handle = 'your-handle';
   ```

## Optional: AI assistant

Set `ANTHROPIC_API_KEY` (server environment only). The draft checker switches from the rule-based checklist to AI-assisted review and labels its output accordingly.

## Production checklist

- [ ] Replace in-memory rate limiting with a shared store if running more than one instance (`src/lib/server/rate-limit.ts`).
- [ ] Publish an operator privacy policy and terms adapted to your jurisdiction.
- [ ] Configure backups for the database.
- [ ] Keep the footer source link pointing at your fork (AGPL §13).
