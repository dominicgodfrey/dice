// The one preferences object (PLAN.md D19, D31), loaded from AsyncStorage
// on mount and written back on every change. `loaded` is false until the
// stored copy has been read, so the grid can wait rather than flash the
// defaults.

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_PREFERENCES, migrate, type Preferences } from "./schema";

const STORAGE_KEY = "dice.preferences";

type Patch =
  Partial<Preferences> | ((prefs: Preferences) => Partial<Preferences>);

type PreferencesApi = {
  prefs: Preferences;
  loaded: boolean;
  update: (patch: Patch) => void;
};

const PreferencesContext = createContext<PreferencesApi | null>(null);

export function usePreferences(): PreferencesApi {
  const api = useContext(PreferencesContext);
  if (!api)
    throw new Error("usePreferences must be used inside PreferencesProvider");
  return api;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ prefs: Preferences; loaded: boolean }>({
    prefs: DEFAULT_PREFERENCES,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        let parsed: unknown = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = null;
        }
        if (!cancelled) setState({ prefs: migrate(parsed), loaded: true });
      })
      .catch(() => {
        if (!cancelled) setState({ prefs: DEFAULT_PREFERENCES, loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.prefs)).catch(
      () => {},
    );
  }, [state]);

  const update = useCallback((patch: Patch) => {
    setState((s) => {
      const delta = typeof patch === "function" ? patch(s.prefs) : patch;
      if (Object.keys(delta).length === 0) return s;
      return { prefs: { ...s.prefs, ...delta }, loaded: s.loaded };
    });
  }, []);

  const api = useMemo(
    () => ({ prefs: state.prefs, loaded: state.loaded, update }),
    [state, update],
  );

  return (
    <PreferencesContext.Provider value={api}>
      {children}
    </PreferencesContext.Provider>
  );
}
