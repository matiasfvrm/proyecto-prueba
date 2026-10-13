"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seedCatalog } from "@/lib/data/seed";
import { mutationSchema, type Mutation } from "@/lib/domain/schemas";
import { applyMutation, buildView, emptyState, type UserState, type View } from "@/lib/store/state";
import { clearState, loadState, saveState } from "@/lib/store/persistence";
import { newId } from "@/lib/store/ids";
import { APP_MODE } from "@/lib/config";
import { useToast } from "./toast-provider";

export type DispatchResult = { ok: true; message: string; createdId?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

interface StoreValue {
  view: View;
  /** False until browser storage has been read. Use to avoid flashing signed-out UI. */
  hydrated: boolean;
  dispatch: (m: Mutation, opts?: { silent?: boolean }) => Promise<DispatchResult>;
  signIn: (userId: string) => void;
  signOut: () => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

async function serverValidate(m: Mutation): Promise<DispatchResult | null> {
  try {
    const res = await fetch("/api/mutations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(m),
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | null;
    if (!res.ok || !body?.ok) {
      return { ok: false, error: body?.error ?? `Request failed (${res.status}).`, fieldErrors: body?.fieldErrors };
    }
    return null;
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UserState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const { notify } = useToast();

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

  const view = useMemo(() => buildView(seedCatalog, state), [state]);

  const dispatch = useCallback<StoreValue["dispatch"]>(
    async (m, opts) => {
      const parsed = mutationSchema.safeParse(m);
      if (!parsed.success) {
        const error = parsed.error.issues[0]?.message ?? "Invalid input.";
        if (!opts?.silent) notify("error", error);
        return { ok: false, error };
      }
      // Server-side validation and rate limiting run for every mutation, in every mode.
      const serverError = await serverValidate(parsed.data);
      if (serverError) {
        if (!opts?.silent && serverError.ok === false) notify("error", serverError.error);
        return serverError;
      }
      const result = applyMutation(seedCatalog, state, parsed.data, { now: new Date().toISOString(), newId });
      if (!result.ok) {
        if (!opts?.silent) notify("error", result.error);
        return result;
      }
      commit(result.state);
      if (!opts?.silent) notify("success", result.message);
      return { ok: true, message: result.message, createdId: result.createdId };
    },
    [state, commit, notify],
  );

  const signIn = useCallback(
    (userId: string) => {
      commit({ ...state, currentUserId: userId });
      const name = view.users.find((u) => u.id === userId)?.name;
      notify("success", name ? `Signed in as ${name}.` : "Signed in.");
    },
    [state, commit, notify, view.users],
  );

  const signOut = useCallback(() => {
    commit({ ...state, currentUserId: null });
    notify("success", "Signed out.");
  }, [state, commit, notify]);

  const resetDemo = useCallback(() => {
    clearState();
    setState(emptyState());
    notify("success", "Demo data reset to its initial state.");
  }, [notify]);

  const value = useMemo(() => ({ view, hydrated, dispatch, signIn, signOut, resetDemo }), [view, hydrated, dispatch, signIn, signOut, resetDemo]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const IS_DEMO = APP_MODE === "demo";
