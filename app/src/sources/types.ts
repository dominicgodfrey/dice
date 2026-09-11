// Shapes of the data every tile reads (PLAN.md D6). They mirror the JSON in
// server/fixtures; a feed that replaces a fixture must produce the same
// shape, so nothing here changes when one does.

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** ["07:30", "20:00"]; a close before its open runs past midnight. */
export type HoursRange = [string, string];

export type Meal = { name: string; start: string; end: string };

export type VenueCategory = "dining" | "cafe" | "library" | "gym" | "office";

export type Venue = {
  id: string;
  name: string;
  category: VenueCategory;
  location: string;
  hours: Record<Weekday, HoursRange[]>;
  meals?: { weekday: Meal[]; weekend: Meal[] };
  exceptions: { date: string; hours: HoursRange[]; note?: string }[];
};

export type VenuesData = {
  updated: string;
  verified: boolean;
  venues: Venue[];
};

export type MachineStatus = "available" | "in_use" | "out_of_order";

export type Machine = {
  id: string;
  type: "washer" | "dryer";
  status: MachineStatus;
  minutesLeft: number | null;
};

export type LaundryRoom = { id: string; name: string; machines: Machine[] };

export type LaundryBuilding = {
  id: string;
  name: string;
  rooms: LaundryRoom[];
};

export type LaundryData = { updated: string; buildings: LaundryBuilding[] };

export type ShuttleRoute = {
  id: string;
  name: string;
  color: string;
  stops: string[];
};

export type ShuttleStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export type ShuttleArrival = {
  stopId: string;
  routeId: string;
  minutes: number[];
};

export type ShuttleData = {
  updated: string;
  routes: ShuttleRoute[];
  stops: ShuttleStop[];
  arrivals: ShuttleArrival[];
};

export type CampusEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  category: "campus" | "academic";
  url: string;
};

export type EventsData = { updated: string; events: CampusEvent[] };
