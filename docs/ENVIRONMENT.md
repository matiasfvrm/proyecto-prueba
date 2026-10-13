# Environment variables

See `.env.example`. Summary:

- **No variables** → demo mode. Fully functional; persistence is per-browser.
- **`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`** → Supabase mode. Both are designed to be public; data is protected by RLS.
- **`ANTHROPIC_API_KEY`** (server-only) → AI draft checker. Read only in `src/lib/ai/*`, which imports `server-only` so it can never be bundled for the browser. Optional `ANTHROPIC_MODEL`.
- **`NEXT_PUBLIC_SITE_URL`**, **`NEXT_PUBLIC_REPO_URL`** → metadata, sitemap and footer source link.

Rules:

- Never prefix a secret with `NEXT_PUBLIC_`.
- The Supabase service-role key is not needed by the app. Use it only in trusted admin tooling.
- `.env*.local` files are git-ignored.
