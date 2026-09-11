// Preferences v1 (PLAN.md D19, D31). One versioned object; every tile reads
// its slice. Add a field here and a migration step in `migrate` when the
// version bumps.

export const PREFERENCES_VERSION = 1;

export type Preferences = {
  version: typeof PREFERENCES_VERSION;
  /** Tile IDs in grid order. */
  order: string[];
  /** Tile IDs the student has hidden. */
  hidden: string[];
  /** Search entry IDs promoted to link tiles. */
  promoted: string[];
  followedVenues: string[];
  laundryBuilding: string | null;
  homeStop: string | null;
  /** Has the first-launch gallery been shown (D11)? */
  onboarded: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  version: PREFERENCES_VERSION,
  order: [],
  hidden: [],
  promoted: [],
  followedVenues: [],
  laundryBuilding: null,
  homeStop: null,
  onboarded: false,
};

/**
 * Bring a stored object of any age up to the current version. Anything
 * unrecognisable yields the defaults rather than a crash.
 */
export function migrate(stored: unknown): Preferences {
  if (typeof stored !== "object" || stored === null) return DEFAULT_PREFERENCES;
  const candidate = stored as Partial<Preferences>;
  if (candidate.version === PREFERENCES_VERSION) {
    return {
      ...DEFAULT_PREFERENCES,
      ...candidate,
      version: PREFERENCES_VERSION,
    };
  }
  return DEFAULT_PREFERENCES;
}
