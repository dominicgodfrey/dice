// One place that loads every source, so a tile's collapsed and expanded
// layouts read the same data and nothing fetches twice. Starts from the
// bundled fixtures so tiles render on the first frame, then upgrades to the
// server's copy and re-fetches on an interval.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Origin } from "./client";
import {
  FIXTURES,
  getCampus,
  getEvents,
  getLaundry,
  getMenus,
  getShuttle,
  getVenues,
  type CampusData,
  type EventsData,
  type LaundryData,
  type MenusData,
  type ShuttleData,
  type VenuesData,
} from "./index";

const REFRESH_MS = 60_000;

export type Slot<T> = {
  data: T;
  origin: Origin | null;
  fetchedAt: Date | null;
};

export type Sources = {
  venues: Slot<VenuesData>;
  menus: Slot<MenusData>;
  laundry: Slot<LaundryData>;
  shuttle: Slot<ShuttleData>;
  events: Slot<EventsData>;
  campus: Slot<CampusData>;
};

const initial: Sources = {
  venues: { data: FIXTURES.venues, origin: null, fetchedAt: null },
  menus: { data: FIXTURES.menus, origin: null, fetchedAt: null },
  laundry: { data: FIXTURES.laundry, origin: null, fetchedAt: null },
  shuttle: { data: FIXTURES.shuttle, origin: null, fetchedAt: null },
  events: { data: FIXTURES.events, origin: null, fetchedAt: null },
  campus: { data: FIXTURES.campus, origin: null, fetchedAt: null },
};

const SourcesContext = createContext<Sources>(initial);

export function useSources(): Sources {
  return useContext(SourcesContext);
}

export function SourcesProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<Sources>(initial);

  useEffect(() => {
    let cancelled = false;
    const put = <K extends keyof Sources>(key: K, slot: Sources[K]) => {
      if (!cancelled) setSources((s) => ({ ...s, [key]: slot }));
    };
    const run = () => {
      getVenues().then((r) => put("venues", r));
      getMenus().then((r) => put("menus", r));
      getLaundry().then((r) => put("laundry", r));
      getShuttle().then((r) => put("shuttle", r));
      getEvents().then((r) => put("events", r));
      getCampus().then((r) => put("campus", r));
    };
    run();
    const id = setInterval(run, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <SourcesContext.Provider value={sources}>
      {children}
    </SourcesContext.Provider>
  );
}

/** "Live" when the data came from the server this session, else what it is. */
export function originLabel(slot: Slot<unknown>): string {
  if (slot.origin === "server") return "Live";
  return "Sample data";
}
