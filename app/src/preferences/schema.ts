// Preferences v2 (PLAN.md D19, D31). One versioned object; every tile reads
// its slice. Add a field here and a migration step in `migrate` when the
// version bumps.
//
// v1 -> v2: `laundryBuilding` (a quad) became `laundryRoom` (one room on
// LaundryView, which is the building a student actually lives in).

export const PREFERENCES_VERSION = 2;

export type Preferences = {
  version: typeof PREFERENCES_VERSION;
  /** Tile IDs in grid order. */
  order: string[];
  /** Tile IDs the student has hidden. */
  hidden: string[];
  /** Search entry IDs promoted to link tiles. */
  promoted: string[];
  followedVenues: string[];
  /** LaundryView room ID; a room is one building's laundry. */
  laundryRoom: string | null;
  homeStop: string | null;
  /** Has the first-launch gallery been shown (D11)? */
  onboarded: boolean;
  /** Tile ID -> palette key the student picked (D36). */
  colors: Record<string, string>;
};

export const DEFAULT_PREFERENCES: Preferences = {
  version: PREFERENCES_VERSION,
  order: [],
  hidden: [],
  promoted: [],
  followedVenues: [],
  laundryRoom: null,
  homeStop: null,
  onboarded: false,
  colors: {},
};

/**
 * Bring a stored object of any age up to the current version. Anything
 * unrecognisable yields the defaults rather than a crash.
 */
export function migrate(stored: unknown): Preferences {
  if (typeof stored !== "object" || stored === null) return DEFAULT_PREFERENCES;
  const candidate = stored as Partial<Omit<Preferences, "version">> & {
    version?: number;
    laundryBuilding?: unknown;
  };
  if (candidate.version === 1) {
    // A quad is not a room; ask again rather than guess.
    const { laundryBuilding: _dropped, ...rest } = candidate;
    return { ...DEFAULT_PREFERENCES, ...rest, version: PREFERENCES_VERSION };
  }
  if (candidate.version === PREFERENCES_VERSION) {
    return {
      ...DEFAULT_PREFERENCES,
      ...candidate,
      version: PREFERENCES_VERSION,
    };
  }
  return DEFAULT_PREFERENCES;
}
