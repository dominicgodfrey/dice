# Handoff

Written 2026-09-11 at commit `2571106`, the end of the first build session.
Read this first, then PLAN.md for the why, then WIRING.md for what only the
owner can do.

## What this is

Dice is a student app for Brandeis: one home screen of live, glanceable
tiles, with every other campus service one tap or one search away. Not
affiliated with Brandeis or with Branda, the university's own app. Owner:
Dom (dominicgodfrey@brandeis.edu). Repo: github.com/dominicgodfrey/dice,
public, MIT, trunk on `main`.

Two codebases in one repo:

- `app/` — Expo SDK 57, TypeScript, Expo Router, Reanimated 4, Gesture
  Handler, react-native-web. One tree for iOS, Android and web. The web
  export is the demo.
- `server/` — Go 1.26, stdlib HTTP. Serves fixtures, runs the scrapers and
  feeds, takes bug reports, does magic-link accounts.

## Where things stand

Every build phase in PLAN.md section 3 is done (Phases 0–5), plus a design
pass and a scraping pass. 45 numbered decisions, D1–D45, all in PLAN.md
with the alternative each beat. What remains is in WIRING.md (owner
steps) and Phase 6 (asks that need a person).

The app runs entirely on bundled fixtures when no server is reachable, so
the deployed web build works without a backend but shows sample data with
a "Sample data" label. Deploying the server is what turns the tiles live.

### Tiles (all built, D16–D18, D35, D38, D39)

| Tile | Live source | Notes |
|---|---|---|
| Hours | dining site hours page + LibCal, scraped | today's hours arrive as dated exceptions on the venues |
| Food | dining hall pages, scraped hourly | today's meal periods come with them |
| Laundry | LaundryView JSON, every 90s | all 24 Brandeis rooms; the preference is one room (D43) |
| BranVan | fixture only | TripShot has no public feed; GTFS-RT parser is built and tested on MBTA |
| Events | CampusGroups + academic ICS, hourly | ~1,900 events |
| Sky | on-device astronomy | star chart, compass, optional GPS |
| Links | preferences | one tile of icons, resizes with count |
| Map | USGS aerial imagery in the bundle | labels projected onto it |

### Verified vs not

Verified in the browser this session: every tile collapsed and expanded,
expand/collapse via tap, swipe, scrim, Escape and back; deep links; long
press, hide, live drag, cancel; colour picker; gallery and onboarding;
search, chips, adding a link; emergency confirm sheet; bug report end to
end against the local server; sign-in end to end with a synced preference;
all scrapers against the live sites; the web export.

Verified in the browser on 2026-09-11 (second session): the header arc
by day; the room-level laundry picker; swipe right to close and swipe down
from the handle after scrolling; the collapsed watermarks.

Never run on a real device: swipe-to-close over scrolling content, the
compass, GPS, pinch on the map, native builds of any kind. The owner has
not yet opened the deployed URL on a phone (WIRING.md, first item).

## Run and check

```bash
cd app && npm install && npm run web        # http://localhost:8081
cd server && go run .                        # http://localhost:8080/healthz
cd app && npm run check                      # sync fixtures, lint, tsc, jest
cd server && go vet ./... && go test ./...
```

`npm run check` and the server checks are what CI runs on every push
(`.github/workflows/ci.yml`), plus a web export and a check that
`app/src/fixtures/data` matches `server/fixtures`. In development the app
talks to `http://localhost:8080`; `EXPO_PUBLIC_API_URL` overrides, unset
in production means fixtures only. Server env vars are documented at the
top of `server/main.go`. For sign-in without email locally, run the server
with `AUTH_ECHO_LINKS=1` and the Account page shows the link.

## Conventions that will bite you if you skip them

- **Fixtures have one source of truth**: `server/fixtures/*.json`. After
  editing one, `npm run sync-fixtures` in `app/` (the check script does
  it). CI fails if the copies drift.
- **The Expo lint config includes the React Compiler rules.** Reanimated
  shared values must never be written from a `useEffect`, read in an
  effect's dependency array, or captured by `useMemo` with a mutation
  inside. The working pattern is in `ExpandProvider.tsx`: route → React
  state → `useDerivedValue` spring, with mutations only in gesture
  callbacks. Refs cannot be read in render or passed to functions the
  gesture chain calls; pass values through closures or shared values.
  `setState` synchronously inside an effect is an error; derive instead.
- **Text is `src/ui/Text`, not React Native's.** It applies Inter by
  `fontWeight`. Icons are Feather via `src/ui/Icon`; no emoji. Tokens in
  `src/ui/theme.ts`; the rule is D37: if it would look at home in a system
  settings screen, it is right.
- **Prettier runs at 80 columns.** Run `npx prettier --write src app`
  before committing; the check script does not format.
- **Commits are atomic and never list Claude as a contributor** (owner's
  global instruction). Push only when asked; the owner has been asking
  for push at the end of each block of work.
- **Scrapers are tested against saved pages** in
  `server/internal/scrape/testdata`. When a site changes, update the
  saved page and the parser together. Every feed falls back to its
  fixture on failure, so a broken scraper is stale data, not a blank tile.
- **Preferences are one versioned object** (`src/preferences/schema.ts`,
  version 2). Add a field with a default; bump the version only when a
  stored shape has to change, and add a migration step (v1 → v2 is the
  example: `laundryBuilding` became `laundryRoom`).

## Map of the code

App, under `app/src`:

- `grid/` — packer (`pack.ts`), layout constants (`layout.ts`), the grid
  with long-press, drag and colour (`Grid.tsx`), ordering helpers.
- `expand/ExpandProvider.tsx` — the shared-element expansion primitive.
  Expanded tiles are routes under `app/app/(grid)/[tile].tsx`.
- `tiles/` — `registry.ts` (IDs, spans, icons, default colours),
  `Tile.tsx` (dispatch), `shells.tsx` (collapsed/expanded frames), one
  folder per tile with a pure `*.ts` logic module and a `*Tile.tsx`.
- `sources/` — `client.ts` (fetch with fixture fallback), `index.ts`
  (typed getters), `SourcesProvider.tsx` (loads all, refreshes every
  minute), `types.ts` (the JSON shapes).
- `sky/` — sun, bodies, star catalog, chart projection, compass hook,
  and `arc.ts` for the header's rise-to-set line.
- `map/` — imagery extent, Mercator projection, the map component.
- `search/` — the fixture of entries and the fuzzy matcher.
- `account/`, `preferences/`, `observability/`, `ui/`, and `chrome/`
  (the header with its `DayArc`, the bottom bar, the page).

Server, under `server/`:

- `fixtures/` — the JSON files, embedded; served at `/api/v1/<name>`.
- `internal/api` — routes, CORS, live-over-fixture logic.
- `internal/feeds` — refresh caches per source; `scrapers.go` merges the
  scrapes into fixture shapes; `feeds.go` has ICS, menus URL, GTFS-RT.
- `internal/scrape` — the parsers. `internal/ics`, `internal/gtfsrt`.
- `internal/accounts` — magic links, sessions, preferences; Postgres and
  in-memory stores. `internal/mail`, `internal/bugreport`, `internal/refresh`.
- `cmd/gtfsprobe` — demo the shuttle parser against MBTA.

## Known rough edges

- Venue hours, emergency numbers, vendor URLs and map label positions are
  best guesses where not scraped; each is marked VERIFY in its file and
  listed in WIRING.md.
- The star catalog is from memory, good to a fraction of a degree.
- LaundryView was checked against live rooms on 2026-09-11: running,
  extended-cycle, out-of-service and stacked machines all parse. 18 of the
  24 rooms reported "Offline" that day; the app shows those as "Not
  reporting" rather than broken. If a room stays offline into term, ask
  whether it has moved off LaundryView.
- Lower Usdan's page had no scheduled hours the day it was scraped, so
  the menus feed has an empty entry for it until a day it is open.
- The web build has console errors in development when the local server
  is not running; that is the fallback path working, not a bug.
- Store screenshots do not exist; icon, splash and favicon do.

## Suggested next work, in order

1. Whatever the owner reports from opening the deployed URL on a phone:
   expansion feel (D9 has a cheap fallback), SOS placement (D13), the
   gestures never run on a device.
2. Deploy the server (Dockerfile in `server/`), set `EXPO_PUBLIC_API_URL`,
   and watch the scrapers in the log for a week.
3. Correct label positions on the imagery; add entrances and rooms.
4. Native builds and store submission (screenshots, deep links for
   `/signin`).
5. Phase 6 asks: TripShot feed from Transportation, LibCal availability,
   a Student Affairs sponsor.
