// Hook form of a source: loads on mount, exposes where the data came from,
// and can be asked to refresh.

import { useCallback, useEffect, useState } from "react";
import type { Origin, Sourced } from "./client";

export type SourceState<T> = {
  data: T | null;
  origin: Origin | null;
  loading: boolean;
  refresh: () => void;
};

export function useSource<T>(load: () => Promise<Sourced<T>>): SourceState<T> {
  const [state, setState] = useState<{
    data: T | null;
    origin: Origin | null;
    loading: boolean;
  }>({ data: null, origin: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load().then((r) => {
      if (!cancelled)
        setState({ data: r.data, origin: r.origin, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [load, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refresh };
}
