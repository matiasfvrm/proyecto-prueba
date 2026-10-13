/** Runtime mode. Public env vars only — safe to import in client code. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type AppMode = "demo" | "supabase";
export const APP_MODE: AppMode = SUPABASE_URL && SUPABASE_ANON_KEY ? "supabase" : "demo";

export const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/matiasfvrm/proyecto-prueba";
