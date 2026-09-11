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
  /** Scraped meal periods for one date; used when it is today (D40). */
  todayMeals?: Meal[];
  todayDate?: string;
};

export type VenuesData = {
  updated: string;
  verified: boolean;
  venues: Venue[];
};

/** offline: the room is not reporting, so the machine's state is unknown. */
export type MachineStatus = "available" | "in_use" | "out_of_order" | "offline";

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

export type ShuttleVehicle = {
  id: string;
  routeId: string;
  lat: number;
  lon: number;
  /** The stop it is heading to, if the feed says. */
  nextStopId?: string;
};

export type ShuttleData = {
  updated: string;
  routes: ShuttleRoute[];
  stops: ShuttleStop[];
  arrivals: ShuttleArrival[];
  vehicles?: ShuttleVehicle[];
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

export type MenuStation = { station: string; items: string[] };

/** halls[venueId][mealName] */
export type MenusData = {
  updated: string;
  halls: Record<string, Record<string, MenuStation[]>>;
};

export type Building = {
  id: string;
  name: string;
  kind:
    | "academic"
    | "residence"
    | "dining"
    | "library"
    | "athletics"
    | "student"
    | "arts"
    | "admin"
    | "other";
  lat: number;
  lon: number;
  /** Footprint in metres and rotation in degrees. */
  w: number;
  h: number;
  rot: number;
  entrances: { lat: number; lon: number; label: string }[];
  rooms: { lat: number; lon: number; label: string }[];
};

export type Place = { id: string; name: string; lat: number; lon: number };

export type PhotoCheckpoint = {
  id: string;
  lat: number;
  lon: number;
  label: string;
  url: string;
};

export type CampusData = {
  updated: string;
  origin: { lat: number; lon: number };
  buildings: Building[];
  places: Place[];
  photos: PhotoCheckpoint[];
};
