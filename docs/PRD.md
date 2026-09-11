# Dice — PRD

**Status:** Revised after design interview, 2026-09-11 · **Owner:** Dom · **Platforms:** iOS, Android, web (one codebase)

Dice is a student app for Brandeis. The name carries no university mark; the
university's own app is Branda, and Dice is not affiliated with it or with
Brandeis University.

The original draft is preserved at the end of this file. The sections above it
are what stands now. [PLAN.md](PLAN.md) records every decision, why it was
made, and the build order.

## Problem

Branda, the current student app, is a list of disconnected pages. Students
bounce between five vendor apps and portals for things they check every day
(dining, laundry, shuttle, events). Nothing is live, nothing is personalized,
and nothing feels modern.

## Goal

One app that answers "what's going on right now?" at a glance, with live campus
data on a single home screen, and puts every other campus service one tap or
one search away.

## Audience, in order

1. Prospective teammates and the owner: the codebase has to be something a
   teammate clones and runs in ten minutes.
2. Students who might use it: the demo is a URL that opens on any phone.
3. Later, Student Affairs and Transportation: the same build, with as many
   real feeds as could be wired without their help, and a clear list of what
   their help would unlock.

## Principle for the demo

**The demo is further out, so everything that does not need somebody's
permission or access is built ahead of time.** Mocked data is a fallback
behind a real integration, not the plan. Things that need access from the
university or a vendor are built up to the seam and stubbed there.

## Non-goals (v1)

- Replacing any university system (Moodle, Workday, MyHousing): link only
- Camera-based AR
- NFC card emulation (not feasible; revisit only if Brandeis enables mobile credential)
- Automatic reordering of the home grid. The grid never moves anything the
  student did not move.

## UX direction

- **Bento home.** One scrolling fixed-column grid of colored, glanceable tiles
  with static spans (1×1, 2×1, 2×2). Tiles show live state ("3 washers free",
  "BranVan in 6 min") rather than titles.
- **Expand in place.** Tapping a live tile grows it, shared-element style, into
  a full view; swipe down shrinks it back. No page navigation on the main flow.
  Pure link tiles open their destination directly and do not expand.
- **The grid is the student's.** Long-press any tile for a menu: hide, move.
  Moving drags the tile with the others flowing around a live gap and flowing
  back on cancel. Hidden tiles come back from a gallery in edit mode, which is
  also what onboarding opens so a new student picks what they care about.
- **Search pill**, fixed at the bottom, loose fuzzy search over everything that
  is not a tile: links, rooms, bug report, policies, and jumping to a tile.
  A chip row of quick links above the keyboard. Any link result can be
  promoted to a tile. Designed to grow into an agent over the Brandeis site.
- **Emergency**: a fixed red button beside the search pill, visually distinct
  from it (different shape, clear gap, labelled), tap only. It opens a full
  emergency page: BEMCo, Public Safety, 911, counseling after-hours, share my
  location. Dial buttons show a brief "you are about to call X" first.
- **Ambient header.** Time-of-day sky band from sunrise and sunset; feeds the
  astronomy tile.
- Web renders the same tiles in a wider grid. Expansion is the same animation
  with the expanded view capped in width, so on desktop it reads as a modal
  over the dimmed grid. Every expanded tile is a route, so a link can open one
  directly.
- Light theme only. Reduced motion is honoured.

## Tiles

| Tile | Span | Collapsed | Expanded | Configurable |
|---|---|---|---|---|
| Hours | 2×1 | Three-row table: venue, open/closed, next change | Every followed venue grouped by category, with weekly hours | Which venues are followed (default: both dining halls, Starbucks, Dunkin, library) |
| Food | 2×1 | One headline per dining hall for the current meal | Table per hall per meal, station and a few items; Grubhub link | none |
| Laundry | 1×1 | "3 washers · 1 dryer free" for the student's building | Every building, per-machine state and time left | Building, asked on first expand |
| BranVan | 1×1 | Nearest stop, next arrival | Routes, next arrivals per stop, live map | Home stop |
| Events | 2×1 | Next event title and start time | Today and this week, add-to-calendar | none |
| Sky | 2×2 | Sunset time, what is up now | Static dome with moon and visible planets; "point your phone" button for the orientation view | none |
| Link tiles | 1×1 | Icon and name | none: opens the URL | Which links are promoted (all hidden by default) |

## Features and approach

| Feature | Data source | Approach | Needs access? |
|---|---|---|---|
| Emergency page | Public Safety, BEMCo numbers | `tel:` links from one fixture; share location as SMS with a maps link | No |
| Links (Moodle, MyHousing, Workday, CampusGroups, Grubhub, ReusePass, get mobile) | Vendor URLs | Search entries, chip row, promotable link tiles | No |
| OneSearch | Library Primo | Build search URL, open externally | No |
| Privacy policy, Join the team, About with disclaimer | Static | Static routes, written now | No |
| Bug report | Own form | Form posts to the Go backend, which files it and emails the team; Sentry attaches device, route, logs | No |
| Observability | Sentry, PostHog free tiers | Wired from the start; privacy page says what is collected | No |
| Hours | Own venue fixture, hand-maintained | Fixture in the backend, served over HTTP, exceptions editable | No |
| Menus | Dining vendor site | Hourly scrape in Go, cached, fixture fallback | No, but fragile |
| Campus events + academic calendar | CampusGroups ICS, registrar page | Cron fetch and parse in Go, cache; "Add to Google" URL template | Verify: is the ICS public? |
| BranVan | TripShot GTFS-RT | GTFS-RT parser built and tested against a public feed (MBTA); Brandeis URL plugged in when granted | Yes, for the Brandeis feed |
| Sky | astronomy-engine on device | Sun, moon, planets from the campus coordinate; orientation view behind a button | No |
| Room reservations | LibCal, 25Live | Link both; native LibCal grid if a public availability endpoint exists | Verify |
| Work orders | Facilities web form | Link or webview | No |
| Laundry | Vendor endpoints | Fixture behind the seam; ask vendor; reverse-engineer only as a last resort | Yes |
| Map + photo checkpoints | Own photos, stylized SVG map | Map framework and zoom levels now; photos as they are taken | No, but effort |
| Accounts | brandeis.edu email verification | Magic-link sign-in in Go; preferences sync as one blob | No |
| NFC card | Card vendor | Not feasible; link to mobile credential if offered | Blocked |

## Tech

- **App:** Expo (React Native) with react-native-web, TypeScript, Expo Router,
  Reanimated and Gesture Handler. One codebase for iOS, Android and web. The
  web build is the demo URL, hosted on Cloudflare Pages.
- **Repo:** `github.com/dominicgodfrey/dice`, public, MIT. `app/` and
  `server/`.
- **Backend:** Go. Serves fixtures over HTTP from day one, runs the cron
  fetchers (ICS, menus, GTFS-RT), takes bug reports, and later owns accounts.
  Postgres when accounts arrive; before that, files and memory are enough.
- **Data seam:** every tile reads a typed source module (`getHours()`,
  `getShuttleArrivals()`, and so on). Each source fetches from the backend and
  falls back to a bundled fixture. Swapping a fixture for a feed is a backend
  change.
- **Preferences:** one versioned local object holding tile order, hidden and
  promoted tiles, followed venues, laundry building, home stop. Syncs as a blob
  once accounts exist.
- **Observability:** Sentry, PostHog.
- **Cost at 1–500 users:** about $140 year one (Apple $99, Play $25, domain)
  plus a small VPS for Go, free tiers for everything else.

## Risks and dependencies

- Scraped sources break or block; prefer vendor-granted feeds, keep the fixture
  fallback so a broken scraper degrades to stale rather than blank.
- Branding: no university marks, "not affiliated" disclaimer on the about page,
  the app name and the icon.
- Coordinate with the Branda team; seek a student-affairs sponsor for data
  access and continuity.
- Launch window: late August (or January fallback).

## Open questions

- Which dining, laundry, and room-booking vendors are current?
- Is the CampusGroups events ICS public, or per-user?
- Will Transportation share the TripShot GTFS-RT feed?
- Does Brandeis plan to offer mobile credential for the new cards?
- Does LibCal expose a public availability endpoint for study rooms?

---

## Original draft (2026-09-11, before the interview)

**Status:** Draft for demo · **Owner:** Dom · **Platforms:** Web + iOS/Android

### Problem

Branda, the current student app, is a list of disconnected pages. Students bounce between five vendor apps and portals for things they check every day (dining, laundry, shuttle, events). Nothing is live, nothing is personalized, and nothing feels modern.

### Goal

One app that answers "what's going on right now?" at a glance, with live campus data on a single home screen, and puts every other campus service one tap or one search away.

### Non-goals (v1)

- Replacing any university system (Moodle, Workday, MyHousing) — link only
- Camera-based AR
- NFC card emulation (not feasible; revisit only if Brandeis enables mobile credential)

### UX direction

- **Bento home.** One scrolling grid of colored, glanceable tiles. Tiles show live state (3 washers free, BranVan in 6 min) rather than titles.
- **Expand in place.** Tapping a tile grows it into a full view; swipe down to return. No page navigation on the main flow.
- **Search pill** at the bottom for everything that isn't a tile (links, rooms, bug report, policies). Voice input optional.
- **Emergency** as a persistent button, always visible.
- **Gentle personalization.** Tiles reorder between sessions by time of day and usage; long-press to pin, hide, or rearrange.
- **Ambient header.** Time-of-day sky band; feeds the astronomy feature.
- Web mirrors the same tiles in a wider grid; expand becomes a modal.

### Features and possible implementation

| Feature | Data source | Approach | Difficulty |
|---|---|---|---|
| Emergency services | Public Safety numbers | Hardcoded `tel:` links + share location | Easy |
| Links (Moodle, MyHousing, Workday, CampusGroups, register event, get mobile) | Vendor URLs | Deep links via search + chip row | Easy |
| OneSearch | Library Primo | Build search URL, open externally | Easy |
| ReusePass | Topanga | Link/webview only | Easy |
| Privacy policy / Join the team | Static | Static pages, required for store submission | Easy |
| Bug contact form + auto logging | Own form + Sentry | Form → Supabase + email; Sentry attaches device, route, logs | Easy |
| Device survey | PostHog/Plausible | Analytics gives device/OS/platform; survey adds device count | Easy |
| Campus events + academic calendar + Google Cal | CampusGroups ICS, registrar page | Cron parse, cache; "Add to Google" URL template | Medium |
| Work orders | Facilities web form | Link/webview first; native form only if stable | Medium |
| Menus and hours | Dining vendor site JSON | Hourly scrape, store, hand-maintain exceptions | Medium |
| Room reservations | LibCal API (study rooms), 25Live (classrooms) | Native LibCal availability grid; link 25Live | Medium |
| BranVan | TripShot GTFS-RT feed | Request feed URL from Transportation; parse GTFS-RT | Medium (Easy if feed granted) |
| Astronomy "what's overhead" | astronomy-engine (on-device) | Device orientation + location → SVG sky overlay | Medium |
| Laundry | Vendor app endpoints | Ask vendor for access; otherwise reverse-engineer (fragile) | Hard |
| Map + photo checkpoints | Own photos, stylized SVG map | Zoom levels reveal rooms/entrances/photo dots | Hard (effort) |
| NFC card | Card vendor | Not feasible; link to mobile credential if offered | Blocked |

### Demo scope

Build the home grid with mocked data for dining, laundry, BranVan, events, and sky, plus working expand-in-place, search pill, and emergency button. Real integrations to attempt first: CampusGroups ICS and TripShot GTFS-RT (if feed provided).

### Tech (proposed)

- **Frontend:** React (web) + React Native/Expo (mobile), shared components
- **Backend:** Supabase (DB, auth), Cloudflare Workers (cron scrapers), Expo push
- **Observability:** Sentry, PostHog
- **Cost at 1–500 users:** ~$140 year one (Apple $99, Play $25, domain), free tiers for everything else

### Risks and dependencies

- Scraped sources break or block; prefer vendor-granted feeds
- Branding: no university marks, "not affiliated" disclaimer
- Coordinate with the Branda team; seek a student-affairs sponsor for data access and continuity
- Launch window: late August (or January fallback)

### Open questions

- Which dining, laundry, and room-booking vendors are current?
- Will Transportation share the TripShot GTFS-RT feed?
- Does Brandeis plan to offer mobile credential for the new cards?
