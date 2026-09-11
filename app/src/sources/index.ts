// The typed source modules (PLAN.md D6). Each returns one shape whether the
// data came from the server or the bundled fixture.

import eventsFixture from "../fixtures/data/events.json";
import laundryFixture from "../fixtures/data/laundry.json";
import shuttleFixture from "../fixtures/data/shuttle.json";
import venuesFixture from "../fixtures/data/venues.json";
import { fetchWithFallback, hasArrays, type Sourced } from "./client";
import type { EventsData, LaundryData, ShuttleData, VenuesData } from "./types";

export type { Origin, Sourced } from "./client";
export * from "./types";

export function getVenues(): Promise<Sourced<VenuesData>> {
  return fetchWithFallback(
    "/api/v1/venues",
    venuesFixture as unknown as VenuesData,
    (v): v is VenuesData => hasArrays(v, "venues"),
  );
}

export function getLaundry(): Promise<Sourced<LaundryData>> {
  return fetchWithFallback(
    "/api/v1/laundry",
    laundryFixture as unknown as LaundryData,
    (v): v is LaundryData => hasArrays(v, "buildings"),
  );
}

export function getShuttle(): Promise<Sourced<ShuttleData>> {
  return fetchWithFallback(
    "/api/v1/shuttle",
    shuttleFixture as unknown as ShuttleData,
    (v): v is ShuttleData => hasArrays(v, "routes", "stops", "arrivals"),
  );
}

export function getEvents(): Promise<Sourced<EventsData>> {
  return fetchWithFallback(
    "/api/v1/events",
    eventsFixture as unknown as EventsData,
    (v): v is EventsData => hasArrays(v, "events"),
  );
}
