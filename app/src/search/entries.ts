// The search fixture (PLAN.md D15). Every entry has one of three actions:
// open a URL ("{query}" is replaced with the typed text), open a route, or
// expand a tile. The chip row is drawn from entries with `chip`. Any URL
// entry can be promoted to a link tile (D12).
//
// VERIFY: the vendor URLs marked below are best guesses and need checking
// against the live services before the demo goes to students.

import type { TileId } from "../tiles/registry";

export type SearchAction =
  | { kind: "url"; url: string }
  | { kind: "route"; route: string }
  | { kind: "tile"; tile: TileId };

export type SearchEntry = {
  id: string;
  title: string;
  /** Extra words the fuzzy match considers. */
  keywords: string[];
  /** An emoji for now; icons come with the palette (D33). */
  icon: string;
  /** Short line under the title. */
  subtitle: string;
  action: SearchAction;
  chip?: boolean;
  /** Link tile colour when promoted. */
  color?: string;
};

export const ENTRIES: readonly SearchEntry[] = [
  {
    id: "moodle",
    title: "Moodle",
    keywords: ["latte", "courses", "classes", "assignments", "lms"],
    icon: "📚",
    subtitle: "Courses and assignments",
    action: { kind: "url", url: "https://moodle.brandeis.edu" },
    chip: true,
    color: "#F26B3A",
  },
  {
    id: "workday",
    title: "Workday",
    keywords: ["registration", "grades", "pay", "timesheet", "sage"],
    icon: "🗂️",
    subtitle: "Registration, grades, pay",
    action: { kind: "url", url: "https://www.myworkday.com/brandeis" },
    chip: true,
    color: "#0875E1",
  },
  {
    id: "myhousing",
    title: "MyHousing",
    keywords: ["housing", "dorm", "room", "residence", "starrez"],
    icon: "🏠",
    subtitle: "Housing portal",
    // VERIFY: StarRez portal URL.
    action: {
      kind: "url",
      url: "https://brandeis.starrezhousing.com/StarRezPortalX",
    },
    color: "#7B61FF",
  },
  {
    id: "campusgroups",
    title: "CampusGroups",
    keywords: ["clubs", "events", "register", "organizations"],
    icon: "🎪",
    subtitle: "Clubs and event registration",
    action: { kind: "url", url: "https://brandeis.campusgroups.com" },
    chip: true,
    color: "#2E9E6B",
  },
  {
    id: "grubhub",
    title: "Grubhub",
    keywords: ["food", "order", "dining", "pickup", "campus dining"],
    icon: "🥡",
    subtitle: "Order ahead on campus",
    // VERIFY: campus dining landing URL.
    action: {
      kind: "url",
      url: "https://www.grubhub.com/campus-dining/brandeis",
    },
    chip: true,
    color: "#E8613C",
  },
  {
    id: "reusepass",
    title: "ReusePass",
    keywords: ["topanga", "containers", "reusable", "return"],
    icon: "♻️",
    subtitle: "Reusable container returns",
    // VERIFY: Topanga ReusePass URL.
    action: { kind: "url", url: "https://www.reusepass.com" },
    color: "#3A9D5D",
  },
  {
    id: "onesearch",
    title: "OneSearch",
    keywords: ["library", "books", "articles", "primo", "catalog", "research"],
    icon: "🔎",
    subtitle: "Search the library",
    // VERIFY: Primo view ID.
    action: {
      kind: "url",
      url: "https://brandeis.primo.exlibrisgroup.com/discovery/search?query=any,contains,{query}&vid=01BRAND_INST:BRAND",
    },
    chip: true,
    color: "#1F6FB2",
  },
  {
    id: "libcal",
    title: "Study rooms",
    keywords: ["libcal", "library", "reserve", "book a room", "group study"],
    icon: "🪑",
    subtitle: "Reserve a library study room",
    action: { kind: "url", url: "https://brandeis.libcal.com" },
    color: "#5C6BC0",
  },
  {
    id: "25live",
    title: "25Live",
    keywords: ["classroom", "reserve", "space", "event space", "room booking"],
    icon: "🏫",
    subtitle: "Reserve a classroom or event space",
    action: { kind: "url", url: "https://25live.collegenet.com/pro/brandeis" },
    color: "#8E6C3A",
  },
  {
    id: "facilities",
    title: "Work order",
    keywords: ["facilities", "repair", "broken", "maintenance", "heat", "leak"],
    icon: "🛠️",
    subtitle: "Report something broken",
    // VERIFY: facilities work-order form URL.
    action: { kind: "url", url: "https://www.brandeis.edu/facilities/" },
    color: "#6B7280",
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
    icon: "🆘",
    subtitle: "BEMCo, Public Safety, 911",
    action: { kind: "route", route: "/emergency" },
  },
  {
    id: "edit",
    title: "Edit tiles",
    keywords: ["hide", "show", "rearrange", "customize", "layout"],
    icon: "🎛️",
    subtitle: "Choose what is on your home screen",
    action: { kind: "route", route: "/edit" },
  },
  {
    id: "privacy",
    title: "Privacy policy",
    keywords: ["data", "tracking", "analytics"],
    icon: "🔒",
    subtitle: "What Dice collects",
    action: { kind: "route", route: "/privacy" },
  },
  {
    id: "about",
    title: "About Dice",
    keywords: ["version", "who made this", "disclaimer", "affiliated"],
    icon: "🎲",
    subtitle: "Not affiliated with Brandeis",
    action: { kind: "route", route: "/about" },
  },
  {
    id: "join",
    title: "Join the team",
    keywords: ["contribute", "help build", "github", "developer", "design"],
    icon: "🙌",
    subtitle: "Help build Dice",
    action: { kind: "route", route: "/join" },
  },
  {
    id: "tile-hours",
    title: "Hours",
    keywords: ["open", "closed", "when does", "library hours", "dining hours"],
    icon: "🕒",
    subtitle: "Tile",
    action: { kind: "tile", tile: "hours" },
  },
  {
    id: "tile-food",
    title: "Food",
    keywords: ["menu", "dining", "sherman", "usdan", "lunch", "dinner"],
    icon: "🍽️",
    subtitle: "Tile",
    action: { kind: "tile", tile: "food" },
  },
  {
    id: "tile-laundry",
    title: "Laundry",
    keywords: ["washer", "dryer", "machines"],
    icon: "🧺",
    subtitle: "Tile",
    action: { kind: "tile", tile: "laundry" },
  },
  {
    id: "tile-branvan",
    title: "BranVan",
    keywords: ["shuttle", "bus", "van", "waltham", "boston", "cambridge"],
    icon: "🚐",
    subtitle: "Tile",
    action: { kind: "tile", tile: "branvan" },
  },
  {
    id: "tile-events",
    title: "Events",
    keywords: ["calendar", "what's on", "this week", "academic calendar"],
    icon: "📅",
    subtitle: "Tile",
    action: { kind: "tile", tile: "events" },
  },
  {
    id: "tile-sky",
    title: "Sky",
    keywords: ["sunset", "sunrise", "moon", "planets", "stars", "astronomy"],
    icon: "🌙",
    subtitle: "Tile",
    action: { kind: "tile", tile: "sky" },
  },
];

export const ENTRY_BY_ID: ReadonlyMap<string, SearchEntry> = new Map(
  ENTRIES.map((e) => [e.id, e]),
);

export const CHIPS: readonly SearchEntry[] = ENTRIES.filter((e) => e.chip);

/** Entries that can become link tiles (D12). */
export const PROMOTABLE: readonly SearchEntry[] = ENTRIES.filter(
  (e) => e.action.kind === "url",
);
