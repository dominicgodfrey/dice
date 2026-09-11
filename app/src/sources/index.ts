// The typed source modules (PLAN.md D6). Each returns one shape whether the
// data came from the server or the bundled fixture.

import campusFixture from "../fixtures/data/campus.json";
import eventsFixture from "../fixtures/data/events.json";
import laundryFixture from "../fixtures/data/laundry.json";
import menusFixture from "../fixtures/data/menus.json";
import shuttleFixture from "../fixtures/data/shuttle.json";
import venuesFixture from "../fixtures/data/venues.json";
import { fetchWithFallback, hasArrays, isRecord, type Sourced } from "./client";
import type {
  CampusData,
  EventsData,
  LaundryData,
  MenusData,
  ShuttleData,
  VenuesData,
} from "./types";

export type { Origin, Sourced } from "./client";
export * from "./types";

/** The bundled copies, for a first render before any fetch returns. */
export const FIXTURES = {
  venues: venuesFixture as unknown as VenuesData,
  menus: menusFixture as unknown as MenusData,
  laundry: laundryFixture as unknown as LaundryData,
  shuttle: shuttleFixture as unknown as ShuttleData,
  events: eventsFixture as unknown as EventsData,
  campus: campusFixture as unknown as CampusData,
};

export function getVenues(): Promise<Sourced<VenuesData>> {
  return fetchWithFallback(
    "/api/v1/venues",
    FIXTURES.venues,
    (v): v is VenuesData => hasArrays(v, "venues"),
  );
}

export function getMenus(): Promise<Sourced<MenusData>> {
  return fetchWithFallback(
    "/api/v1/menus",
    FIXTURES.menus,
    (v): v is MenusData => isRecord(v) && isRecord(v.halls),
  );
}

export function getLaundry(): Promise<Sourced<LaundryData>> {
  return fetchWithFallback(
    "/api/v1/laundry",
    FIXTURES.laundry,
    (v): v is LaundryData => hasArrays(v, "buildings"),
  );
}

export function getShuttle(): Promise<Sourced<ShuttleData>> {
  return fetchWithFallback(
    "/api/v1/shuttle",
    FIXTURES.shuttle,
    (v): v is ShuttleData => hasArrays(v, "routes", "stops", "arrivals"),
  );
}

export function getEvents(): Promise<Sourced<EventsData>> {
  return fetchWithFallback(
    "/api/v1/events",
    FIXTURES.events,
    (v): v is EventsData => hasArrays(v, "events"),
  );
}

export function getCampus(): Promise<Sourced<CampusData>> {
  return fetchWithFallback(
    "/api/v1/campus",
    FIXTURES.campus,
    (v): v is CampusData => hasArrays(v, "buildings", "places", "photos"),
  );
}
