"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { appCatalog } from "@/lib/data/catalog";
import { mutationSchema, type Mutation } from "@/lib/domain/schemas";
import { applyMutation, buildView, emptyState, type UserState, type View } from "@/lib/store/state";
import { clearState, loadState, saveState } from "@/lib/store/persistence";
import { newId } from "@/lib/store/ids";
import { APP_MODE } from "@/lib/config";
import { getBrowserClient } from "@/lib/supabase/client";
import { useToast } from "./toast-provider";

export type DispatchResult = { ok: true; message: string; createdId?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

interface StoreValue {
  view: View;
  /** False until persisted state has loaded. Use to avoid flashing signed-out UI. */
  hydrated: boolean;
  /** Supabase mode: signed in with email but no profile created yet. */
  needsProfile: boolean;
  dispatch: (m: Mutation, opts?: { silent?: boolean }) => Promise<DispatchResult>;
  /** Demo mode only: switch to a profile stored in this browser. */
  signIn: (userId: string) => void;
  signOut: () => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);
export const IS_DEMO = APP_MODE === "demo";

async function postMutation(m: Mutation, token?: string | null): Promise<DispatchResult> {
  try {
    const res = await fetch("/api/mutations", {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(m),
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> } | null;
    if (!res.ok || !body?.ok) return { ok: false, error: body?.error ?? `Request failed (${res.status}).`, fieldErrors: body?.fieldErrors };
    return { ok: true, message: body.message ?? "Saved." };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

/** Demo mode: server validates every mutation, then it is applied to state stored in this browser. */
function useDemoBackend() {
  const [state, setState] = useState<UserState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Read browser storage after mount so server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("unsolved:")) setState(loadState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: UserState) => {
    setState(next);
    saveState(next);
  }, []);

  const run = useCallback(
    async (m: Mutation): Promise<DispatchResult> => {
      const server = await postMutation(m);
      if (!server.ok) return server;
      const result = applyMutation(appCatalog, state, m, { now: new Date().toISOString(), newId });
      if (!result.ok) return result;
      commit(result.state);
      return { ok: true, message: result.message, createdId: result.createdId };
    },
    [state, commit],
  );

  return {
    state,
    hydrated,
    needsProfile: false,
    run,
    signIn: (userId: string) => commit({ ...state, currentUserId: userId }),
    signOut: () => commit({ ...state, currentUserId: null }),
    reset: () => {
      clearState();
      setState(emptyState());
    },
  };
}

/** Supabase mode: state comes from the database via /api/state; mutations are applied server-side. */
function useSupabaseBackend() {
  const [state, setState] = useState<UserState>(() => ({ ...emptyState(), follows: {} }));
  const [hydrated, setHydrated] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const token = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", {
        headers: token.current ? { authorization: `Bearer ${token.current}` } : {},
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      const body = await res.json();
      if (body.ok) {
        setState(body.state);
        setNeedsProfile(body.authenticated && !body.hasProfile);
      }
    } catch {
      // Network or backend failure: fall back to the read-only catalog view.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      void refresh();
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        token.current = data.session?.access_token ?? null;
      })
      .catch(() => {
        token.current = null;
      })
      .finally(() => void refresh());
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.access_token ?? null;
      if (next !== token.current) {
        token.current = next;
        void refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const run = useCallback(
    async (m: Mutation): Promise<DispatchResult> => {
      const result = await postMutation(m, token.current);
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );

  return {
    state,
    hydrated,
    needsProfile,
    run,
    signIn: () => {},
    signOut: () => {
      void getBrowserClient()?.auth.signOut();
    },
    reset: () => {},
  };
}

const useBackend = APP_MODE === "demo" ? useDemoBackend : useSupabaseBackend;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const backend = useBackend();
  const { notify } = useToast();
  const view = useMemo(() => buildView(appCatalog, backend.state), [backend.state]);

  const { run } = backend;
  const dispatch = useCallback<StoreValue["dispatch"]>(
    async (m, opts) => {
      const parsed = mutationSchema.safeParse(m);
      if (!parsed.success) {
        const error = parsed.error.issues[0]?.message ?? "Invalid input.";
        if (!opts?.silent) notify("error", error);
        return { ok: false, error };
      }
      const result = await run(parsed.data);
      if (!opts?.silent) notify(result.ok ? "success" : "error", result.ok ? result.message : result.error);
      return result;
    },
    [run, notify],
  );

  const { signIn: backendSignIn, signOut: backendSignOut, reset } = backend;
  const signIn = useCallback(
    (userId: string) => {
      backendSignIn(userId);
      const name = view.users.find((u) => u.id === userId)?.name;
      notify("success", name ? `Signed in as ${name}.` : "Signed in.");
    },
    [backendSignIn, notify, view.users],
  );
  const signOut = useCallback(() => {
    backendSignOut();
    notify("success", "Signed out.");
  }, [backendSignOut, notify]);
  const resetDemo = useCallback(() => {
    reset();
    notify("success", "Demo data reset to its initial state.");
  }, [reset, notify]);

  const value = useMemo(
    () => ({ view, hydrated: backend.hydrated, needsProfile: backend.needsProfile, dispatch, signIn, signOut, resetDemo }),
    [view, backend.hydrated, backend.needsProfile, dispatch, signIn, signOut, resetDemo],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
