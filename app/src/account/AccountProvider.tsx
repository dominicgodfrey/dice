// The account (PLAN.md D20): a session token kept on the device, and the
// preferences blob kept in step with the server while signed in. On
// sign-in the server's copy wins if it has one; otherwise the local copy
// is pushed. After that every local change is pushed, debounced.

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { migrate, type Preferences } from "../preferences/schema";
import { usePreferences } from "../preferences/store";
import {
  pullPreferences,
  pushPreferences,
  requestLink as apiRequestLink,
  signOutRemote,
  verifyToken,
  whoAmI,
  type RequestResult,
} from "./client";

const SESSION_KEY = "dice.session";
const PUSH_DEBOUNCE_MS = 1500;

type Status = "loading" | "out" | "in";

type AccountApi = {
  status: Status;
  email: string | null;
  /** Whether a push is pending or in flight. */
  syncing: boolean;
  requestLink: (email: string) => Promise<RequestResult>;
  verify: (token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountApi | null>(null);

export function useAccount(): AccountApi {
  const v = useContext(AccountContext);
  if (!v) throw new Error("useAccount must be used inside AccountProvider");
  return v;
}

type Stored = { token: string; email: string };

export function AccountProvider({ children }: { children: ReactNode }) {
  const { prefs, loaded, update } = usePreferences();
  const [session, setSession] = useState<Stored | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  // The last blob known to match the server, so we do not push it back.
  const [synced, setSynced] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore the session and check it is still good.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored: Stored | null = null;
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        stored = raw ? (JSON.parse(raw) as Stored) : null;
      } catch {
        stored = null;
      }
      if (cancelled) return;
      if (!stored) return setStatus("out");
      const me = await whoAmI(stored.token);
      if (cancelled) return;
      if (!me) {
        await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
        return setStatus("out");
      }
      setSession({ token: stored.token, email: me.email });
      setStatus("in");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // On sign-in: pull, or seed the server with the local copy.
  const token = session?.token ?? null;
  useEffect(() => {
    if (!token || !loaded) return;
    let cancelled = false;
    (async () => {
      const remote = await pullPreferences(token);
      if (cancelled) return;
      if (remote === undefined) return;
      if (remote === null) {
        const blob = JSON.stringify(prefs);
        if (await pushPreferences(token, blob)) setSynced(blob);
        return;
      }
      const next = migrate(remote);
      setSynced(JSON.stringify(next));
      update(() => next);
    })();
    return () => {
      cancelled = true;
    };
    // Runs when the session changes, not on every local edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loaded]);

  // Push local changes, debounced.
  useEffect(() => {
    if (!token || !loaded || synced === null) return;
    const blob = JSON.stringify(prefs);
    if (blob === synced) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const ok = await pushPreferences(token, blob);
      if (ok) setSynced(blob);
    }, PUSH_DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [prefs, token, loaded, synced]);

  // A push is pending whenever the local blob differs from the last one the
  // server acknowledged.
  const syncing =
    token !== null && synced !== null && JSON.stringify(prefs) !== synced;

  const requestLink = useCallback((email: string) => apiRequestLink(email), []);

  const verify = useCallback(async (t: string): Promise<string | null> => {
    const result = await verifyToken(t);
    if ("error" in result) return result.error;
    const stored: Stored = { token: result.token, email: result.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(stored)).catch(
      () => {},
    );
    setSynced(null);
    setSession(stored);
    setStatus("in");
    return null;
  }, []);

  const signOut = useCallback(async () => {
    if (session) await signOutRemote(session.token);
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    setSession(null);
    setSynced(null);
    setStatus("out");
  }, [session]);

  const api = useMemo<AccountApi>(
    () => ({
      status,
      email: session?.email ?? null,
      syncing,
      requestLink,
      verify,
      signOut,
    }),
    [status, session, syncing, requestLink, verify, signOut],
  );

  return (
    <AccountContext.Provider value={api}>{children}</AccountContext.Provider>
  );
}

export type { Preferences };
