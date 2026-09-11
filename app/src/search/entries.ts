// The search fixture (PLAN.md D15). Every entry has one of three actions:
// open a URL ("{query}" is replaced with the typed text), open a route, or
// expand a tile. The chip row is drawn from entries with `chip`. Any URL
// entry can be promoted to a link tile (D12).
//
// VERIFY: the vendor URLs marked below are best guesses and need checking
// against the live services before the demo goes to students.

import type { TileId } from "../tiles/registry";
import type { IconName } from "../ui/Icon";

export type SearchAction =
  | { kind: "url"; url: string }
  | { kind: "route"; route: string }
  | { kind: "tile"; tile: TileId };

export type SearchEntry = {
  id: string;
  title: string;
  /** Extra words the fuzzy match considers. */
  keywords: string[];
  /** A Feather icon name. */
  icon: IconName;
  /** Short line under the title. */
  subtitle: string;
  action: SearchAction;
  chip?: boolean;
};

export const ENTRIES: readonly SearchEntry[] = [
  {
    id: "moodle",
    title: "Moodle",
    keywords: ["latte", "courses", "classes", "assignments", "lms"],
    icon: "book",
    subtitle: "Courses and assignments",
    action: { kind: "url", url: "https://moodle.brandeis.edu" },
    chip: true,
  },
  {
    id: "workday",
    title: "Workday",
    keywords: ["registration", "grades", "pay", "timesheet", "sage"],
    icon: "briefcase",
    subtitle: "Registration, grades, pay",
    action: { kind: "url", url: "https://www.myworkday.com/brandeis" },
    chip: true,
  },
  {
    id: "myhousing",
    title: "MyHousing",
    keywords: ["housing", "dorm", "room", "residence", "starrez"],
    icon: "home",
    subtitle: "Housing portal",
    // VERIFY: StarRez portal URL.
    action: {
      kind: "url",
      url: "https://brandeis.starrezhousing.com/StarRezPortalX",
    },
  },
  {
    id: "campusgroups",
    title: "CampusGroups",
    keywords: ["clubs", "events", "register", "organizations"],
    icon: "users",
    subtitle: "Clubs and event registration",
    action: { kind: "url", url: "https://brandeis.campusgroups.com" },
    chip: true,
  },
  {
    id: "grubhub",
    title: "Grubhub",
    keywords: ["food", "order", "dining", "pickup", "campus dining"],
    icon: "shopping-bag",
    subtitle: "Order ahead on campus",
    // VERIFY: campus dining landing URL.
    action: {
      kind: "url",
      url: "https://www.grubhub.com/campus-dining/brandeis",
    },
    chip: true,
  },
  {
    id: "reusepass",
    title: "ReusePass",
    keywords: ["topanga", "containers", "reusable", "return"],
    icon: "refresh-cw",
    subtitle: "Reusable container returns",
    // VERIFY: Topanga ReusePass URL.
    action: { kind: "url", url: "https://www.reusepass.com" },
  },
  {
    id: "onesearch",
    title: "OneSearch",
    keywords: ["library", "books", "articles", "primo", "catalog", "research"],
    icon: "search",
    subtitle: "Search the library",
    // VERIFY: Primo view ID.
    action: {
      kind: "url",
      url: "https://brandeis.primo.exlibrisgroup.com/discovery/search?query=any,contains,{query}&vid=01BRAND_INST:BRAND",
    },
    chip: true,
  },
  {
    id: "libcal",
    title: "Study rooms",
    keywords: ["libcal", "library", "reserve", "book a room", "group study"],
    icon: "layout",
    subtitle: "Reserve a library study room",
    action: { kind: "url", url: "https://brandeis.libcal.com" },
  },
  {
    id: "25live",
    title: "25Live",
    keywords: ["classroom", "reserve", "space", "event space", "room booking"],
    icon: "grid",
    subtitle: "Reserve a classroom or event space",
    action: { kind: "url", url: "https://25live.collegenet.com/pro/brandeis" },
  },
  {
    id: "facilities",
    title: "Work order",
    keywords: ["facilities", "repair", "broken", "maintenance", "heat", "leak"],
    icon: "tool",
    subtitle: "Report something broken",
    // VERIFY: facilities work-order form URL.
    action: { kind: "url", url: "https://www.brandeis.edu/facilities/" },
  },
  {
    id: "emergency",
    title: "Emergency",
    keywords: [
      "sos",
      "police",
      "public safety",
      "bemco",
      "911",
      "help",
      "counseling",
    ],
    icon: "alert-octagon",
    subtitle: "BEMCo, Public Safety, 911",
    action: { kind: "route", route: "/emergency" },
  },
  {
    id: "edit",
    title: "Edit tiles",
    keywords: ["hide", "show", "rearrange", "customize", "layout"],
    icon: "sliders",
    subtitle: "Choose what is on your home screen",
    action: { kind: "route", route: "/edit" },
  },
  {
    id: "bug",
    title: "Report a bug",
    keywords: ["feedback", "broken", "wrong", "problem", "issue", "crash"],
    icon: "message-square",
    subtitle: "Tell the team what went wrong",
    action: { kind: "route", route: "/bug" },
  },
  {
    id: "account",
    title: "Account",
    keywords: ["sign in", "login", "sync", "devices", "email"],
    icon: "user",
    subtitle: "Keep your home screen on every device",
    action: { kind: "route", route: "/account" },
  },
  {
    id: "privacy",
    title: "Privacy policy",
    keywords: ["data", "tracking", "analytics"],
    icon: "lock",
    subtitle: "What Dice collects",
    action: { kind: "route", route: "/privacy" },
  },
  {
    id: "about",
    title: "About Dice",
    keywords: ["version", "who made this", "disclaimer", "affiliated"],
    icon: "info",
    subtitle: "Not affiliated with Brandeis",
    action: { kind: "route", route: "/about" },
  },
  {
    id: "join",
    title: "Join the team",
    keywords: ["contribute", "help build", "github", "developer", "design"],
    icon: "user-plus",
    subtitle: "Help build Dice",
    action: { kind: "route", route: "/join" },
  },
  {
    id: "tile-hours",
    title: "Hours",
    keywords: ["open", "closed", "when does", "library hours", "dining hours"],
    icon: "clock",
    subtitle: "Tile",
    action: { kind: "tile", tile: "hours" },
  },
  {
    id: "tile-food",
    title: "Food",
    keywords: ["menu", "dining", "sherman", "usdan", "lunch", "dinner"],
    icon: "coffee",
    subtitle: "Tile",
    action: { kind: "tile", tile: "food" },
  },
  {
    id: "tile-laundry",
    title: "Laundry",
    keywords: ["washer", "dryer", "machines"],
    icon: "droplet",
    subtitle: "Tile",
    action: { kind: "tile", tile: "laundry" },
  },
  {
    id: "tile-branvan",
    title: "BranVan",
    keywords: ["shuttle", "bus", "van", "waltham", "boston", "cambridge"],
    icon: "truck",
    subtitle: "Tile",
    action: { kind: "tile", tile: "branvan" },
  },
  {
    id: "tile-events",
    title: "Academic Calendar and Events",
    keywords: ["events", "calendar", "what's on", "this week", "month"],
    icon: "calendar",
    subtitle: "Tile",
    action: { kind: "tile", tile: "events" },
  },
  {
    id: "tile-map",
    title: "Map",
    keywords: ["campus map", "where is", "building", "directions", "find"],
    icon: "map",
    subtitle: "Tile",
    action: { kind: "tile", tile: "map" },
  },
  {
    id: "tile-sky",
    title: "Sky",
    keywords: ["sunset", "sunrise", "moon", "planets", "stars", "astronomy"],
    icon: "moon",
    subtitle: "Tile",
    action: { kind: "tile", tile: "sky" },
  },
];

export const ENTRY_BY_ID: ReadonlyMap<string, SearchEntry> = new Map(
  ENTRIES.map((e) => [e.id, e]),
);

export const CHIPS: readonly SearchEntry[] = ENTRIES.filter((e) => e.chip);

/** Entries that can sit on the Links tile (D35). */
export const PROMOTABLE: readonly SearchEntry[] = ENTRIES.filter(
  (e) => e.action.kind === "url",
);
