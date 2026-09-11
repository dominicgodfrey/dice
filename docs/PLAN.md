# Plan and decisions

Written 2026-09-11 from a design interview over the original PRD. Each decision
records the alternative it beat and why, so nobody re-argues it by accident.
Numbered so later documents can cite them. A decision that changes gets a
revision note under it, not a silent edit.

The governing rule, from the interview: **the demo is further out, so
everything that does not need someone's permission or access is built ahead of
time.** Section 3 sorts the work by that rule.

## 1. Decisions

### Audience and scope

**D1. The demo is for prospective teammates, the owner, and interested
students first; Student Affairs and Transportation later.** The sponsor pitch
happens after there is a solid demo, not as the demo. Consequences: the
codebase must be joinable in ten minutes, and the demo must be a URL a student
opens on their phone.

**D2. Build everything that needs no permission ahead of time.** Mocked data is
a fallback behind a real source, not the deliverable. Work that needs the
university or a vendor is built to the seam and stubbed. This revised several
earlier "skip for the demo" calls; see D5, D17, D20 and D21.

### Platform

**D3. One codebase: Expo (React Native) with react-native-web, TypeScript.**
The owner asked for TypeScript and React, a Go backend, and as little rewriting
as possible. A React DOM app cannot become the native app without rewriting
every component, since hooks and state carry over and markup, styling and
gestures do not. Expo plus react-native-web renders one component tree to iOS,
Android and the browser. The price is a second-class web build: heavier
bundle, some CSS unavailable, the wide desktop grid takes more work. Accepted.
Expo Router for routes, Reanimated and Gesture Handler for the tile animation.

**D4. The web build is the demo distribution.** Nobody installs a TestFlight
build to give feedback. Hosted at a URL; native builds come when the store
submission does.

### Backend

**D5. Go backend, from the start.** Replaces the PRD's Supabase plus Cloudflare
Workers. *Revised:* the first answer was "no backend in the demo, fixtures in
the bundle," made when the demo was near. Under D2 the backend is built now
because the cron fetchers (ICS, menus, GTFS-RT), the bug report endpoint and
later accounts all need it, and none of them need anyone's permission. It
serves the fixtures over HTTP from day one so the app's fetch path is exercised
before any feed is real.

**D6. Every tile reads a typed source module with a fixture fallback.**
`getHours()`, `getShuttleArrivals()`, and so on return one shape whether the
data came from the backend or the bundled fixture. A backend that is down or a
scraper that broke degrades to stale, never to a blank tile. Swapping a fixture
for a feed is a backend change with no app release.

**D7. No database until accounts.** Fixtures are files; caches are memory
rewritten by the cron. Postgres arrives with D16.

### The grid

**D8. Fixed-column grid, static spans.** Two columns on a phone, four on web.
A tile declares 1×1, 2×1 or 2×2 and never changes span with its state; rich
content lives in the expanded view. Gaps left by a 2-wide tile after a 1-wide
one are greedy-filled from the tiles that follow. Free-form packing was
rejected: it is a masonry problem, and drag-to-rearrange on top of it is a
layout algorithm nobody wants to own. A grid that reflows when the shuttle
moves is a grid nobody builds muscle memory on.

**D9. True shared-element expansion, built first as one primitive.** Tapping a
live tile animates its rectangle to fill the screen and its content morphs into
the detail view; swipe down reverses it. A bottom sheet over the grid was the
alternative, an afternoon's work, and what every other app does. `ExpandingTile`
owns the geometry; a tile is one component with two layouts chosen by an
`expanded` prop. Build it with a plain colored square before any tile has
content. Fallback if it does not feel right after the first week: the sheet,
with nothing lost.

**D10. No automatic reordering, ever.** The PRD's "reorder between sessions by
time of day and usage" is dropped. Every position is the student's once they
have touched it, and the grid never moves anything they did not move. The
first-launch order is one hand-picked default. Time of day shows up in tile
*content*: Food shows dinner at 6pm, Hours shows what closes soon, the header
changes colour. A deterministic time-of-day scoring scheme was designed and
then rejected on the owner's rule that "the apps should not reorder randomly,"
which from the student's side is what a schedule looks like.

**D11. Long-press menu: hide, move. Move is a live drag.** The dragged tile
follows the finger, the others flow around a gap under it, drop commits,
cancelling flows everything back. "Hide" not "delete": a hidden tile comes back
from a gallery in edit mode. Onboarding opens that same gallery so a new
student picks what they care about rather than inheriting a default they then
prune.

**D12. Generic link tiles, hidden by default, no expansion.** Any entry in the
search fixture with an open-URL action can be promoted to a 1×1 tile from the
search result or the gallery. Grubhub, Moodle, Workday, ReusePass are all this
one component. Tap opens the URL; there is nothing to expand into, so a
press-down scale is the only feedback. Ships hidden so the grid stays
glanceable by default and becomes a launcher only for people who want that.

### Chrome

**D13. Search pill fixed at the bottom; emergency is a fixed red button beside
it, not a tile.** *Revised twice.* First answer: emergency in the bar with
search. Owner: everything should be moveable. Then: emergency as a tile, which
cannot be "always visible" on a scrolling grid. Owner's final call: a small,
unmoveable, always-visible red button that opens an emergency page. Placement
is the right end of the bottom bar, the most reachable spot one-handed. The
owner's UX constraint, that it must never be confused with search or hit by
accident, is met by: a separate element with a visible gap rather than a
segment of the pill; a different shape (circle against a rounded rectangle);
a label ("Emergency" or "SOS") not just a glyph; at least 44pt; tap only, no
gesture, so rearranging cannot trigger it; and the confirmation in D14 so a
stray tap costs a page, never a call. Fallback if it still feels too close:
top-right of the header, a fifteen-minute move. Test on the owner's own phone
in week one.

**D14. The emergency page is a real route with confirmed dials.** The one
place "no page navigation on the main flow" is broken on purpose: a student in
trouble should not be inside a spring animation. BEMCo, Public Safety
emergency and non-emergency, 911, counseling after-hours, each a big button
that shows "you are about to call X" and then dials. Share my location
composes an SMS to Public Safety carrying a maps link of the current
coordinates: no backend, no tracking, works today. Numbers live in one fixture
the page reads, never as literals in the page.

**D15. Search is loose fuzzy matching over one local fixture.** Each entry has
a title, keywords, an icon, and an action of one of three kinds: open URL
(Moodle, Workday, OneSearch with the query substituted), open route (emergency,
policies, bug report), expand tile ("laundry" jumps to the tile). The chip row
above the keyboard is drawn from the same list. Voice input is out. The entry
type leaves room for a fourth action kind, because the owner wants this to grow
into an agent that searches the Brandeis site and other resources; that is a
Go-side feature later and changes nothing in the pill.

### Tiles

**D16. Hours and Food are two tiles over one venue fixture.** The PRD had one
Dining tile; hours and menus for two halls plus Dunkin, Starbucks and the
library do not fit in one collapsed view. One `venues` fixture, each with a
name, category, weekly hours and optionally a menu, feeds both. Hours shows a
compact table of followed venues (default: both dining halls, Starbucks,
Dunkin, library), configurable in its expanded view, and covers campus offices
too. Food shows one headline per dining hall for the current meal, expands to
a table per hall per meal, and carries the Grubhub link. Expanded views use
tables wherever a tile carries more than a line.

**D17. Sky ships layers 1 and 2 from a fixed campus coordinate; layer 3 is
behind a button.** Layer 1: sunrise, sunset, sun altitude, which drives the
header band. Layer 2: moon phase and planets above the horizon, drawn on a
static dome. Both computed on device with astronomy-engine from a hardcoded
Brandeis coordinate, so no permission prompt ever appears. Layer 3, the
orientation-driven "point your phone" view, needs geolocation and, on iOS
Safari, a `DeviceOrientationEvent` permission that only fires from a user
gesture; a button inside the expanded view is that gesture. Under D2 layer 3 is
built too, not stubbed, since it needs nobody's permission but the student's.

**D18. Laundry asks for a building on first expand.** Without it the collapsed
line means nothing. BranVan asks for a home stop the same way. Both are
preferences (D19).

### State and services

**D19. One versioned local preferences object.** Tile order, hidden set,
promoted links, followed venues, laundry building, home stop. Every tile reads
its slice. Adding a preference is one field. It syncs as one blob when accounts
exist.

**D20. Accounts are built, gated on a brandeis.edu email.** *Revised under D2*
from "later." Magic-link sign-in in Go, sending through a transactional mail
provider's free tier; only addresses under brandeis.edu are accepted. The
account owns the preferences blob and nothing else. This is the point D7's
database arrives.

**D21. Sentry and PostHog wired from the start; bug reports go to the
backend.** *Revised under D2* from "skip for the demo." Both have free tiers
and need no permission. The bug form posts to Go, which stores the report and
emails the team, with Sentry attaching device, route and recent logs. The
privacy page names both providers and says what each receives, because that
page is also what the sponsor conversation points at.

**D22. Static pages written now: privacy policy, join the team, about with the
"not affiliated" disclaimer.** Store submission needs the first; the sponsor
conversation needs the third. No university marks anywhere, including the app
name and icon.

### Pre-implementation decisions (2026-09-11, second pass)

Settled after the interview, before the first commit. These are the choices
Phase 0 and Phase 1 could not start without.

**D23. The product is called Dice.** Not "Branda", which is the university's
own app name and so a mark under D22. Derived identifiers: Expo slug `dice`,
URL scheme `dice://`, iOS bundle and Android package `com.dominicgodfrey.dice`
(changeable until store submission), Go module
`github.com/dominicgodfrey/dice/server`. The repository is
`github.com/dominicgodfrey/dice`, public, MIT licensed. Layout: `app/` and
`server/` in that one repo.

**D24. The demo is hosted on Cloudflare Pages through its GitHub
integration.** Root directory `app`, build command `npx expo export -p web`,
output `dist`. Preview URLs are on for pull requests so a teammate gets a link
per branch. The free `pages.dev` hostname is the demo URL until a domain is
bought; the PRD's budget line covers one. A GitHub Actions deploy with wrangler
was the alternative and is the fallback if the integration's Node version
becomes a problem.

**D25. Trunk on main.** Pull requests are optional until a second person
joins; CI runs on every push regardless.

**D26. Toolchain pins.** Node 24, npm, the current Expo SDK with the new
architecture on, Go 1.26, Expo's ESLint config plus Prettier. Pinned in
`.nvmrc`, `package.json` engines, and `go.mod`.

**D27. One expansion primitive everywhere; the expanded rectangle is capped
at 720px wide.** Resolves the PRD's "expand becomes a modal on web" against
D9. On a phone the tile fills the screen; on desktop it fills 720px centred
over the dimmed grid, which reads as a modal without a second code path.

**D28. Grid values.** Two columns under 768px, three to 1024px, four above.
A 1×1 unit is as tall as a column is wide. 12px gutter. Content is capped at
1200px wide on desktop and centred. *Revised in the design pass:* the unit
height is capped at 200px, so on anything wider than a phone a two-wide
tile is a landscape card rather than a large, mostly empty square.

**D29. An expanded tile is a route.** Expanding Laundry navigates to
`/laundry` as an Expo Router modal route that the shared-element animation
targets. The demo is deep-linkable, the browser back button collapses the
tile, and a teammate can send a link straight to one expanded view. Pure link
tiles (D12) have no route.

**D30. Drag is custom.** Reanimated and Gesture Handler, no drag library. Web
pointer support is the part libraries get wrong, and the flow-around and
flow-back in D11 need control of every tile's layout animation anyway.

**D31. Preferences v1 schema and storage.** Tile IDs are stable strings.
`order` is an array of IDs, `hidden` a set of IDs, `promoted` a set of search
entry IDs, plus `followedVenues`, `laundryBuilding` and `homeStop`. An integer
`version` with one migration function per bump. Stored with AsyncStorage,
which is localStorage on web, so one code path.

**D32. No dark mode.** Light only. The ambient header already carries the
time of day, and every tile colour is one value, not a pair. Reduced motion is
honoured: when the OS setting is on, expansion cross-fades instead of morphing.

**D33. Palette and type scale are chosen in the first Phase 1 pull request,
not up front.** System font. One accent per tile category. Decided with a
real tile on a real phone rather than in a document. *Superseded by D37.*

**D34. CI on every push: ESLint, TypeScript, Jest, `go vet`, `go test`.**
Grid packing and preference migrations are pure functions and get tests from
the start. A Playwright smoke test on the exported web build is added after
Phase 1, once there is a grid to click.

### Design pass (2026-09-11, after the first full build)

The owner's review of the first complete build: the look was bland and
"vibe-coded", link tiles cluttered the grid, tiles were text-only, and the
Sky tile did not do what it was for. These decisions answer that.

**D35. One Links tile replaces per-link tiles.** *Revises D12.* A 2×1 tile
shows the student's links as a grid of icons that resize to fill it (one
row up to four, two rows beyond), each opening its URL on tap. Expanded, it
lists every link that can sit on it with a toggle. A new student sees four
defaults (Moodle, Workday, CampusGroups, Grubhub) until they choose. Search
results and the gallery add to this tile instead of creating tiles. One
tile per link made the grid a launcher by default, the opposite of D12's
intent.

**D36. Tile colours come from a fixed palette and the student can change
them.** Eight deep, muted colours (Ink, Ocean, Teal, Moss, Amber, Clay,
Plum, Slate), all with white text, so any choice stays legible and the grid
stays coherent. Each tile has a default; the long-press menu gains Colour
and a swatch sheet; the choice is a preference (`colors`). Free colour
pickers were rejected: they produce grids nobody would ship.

**D37. A design system: Inter, tokens, icons.** *Supersedes D33.* Inter at
four weights, loaded before first render. One neutral ground, white
surfaces with hairline borders, a type scale of six sizes, 4px spacing,
16px tile radius. Feather icons everywhere emoji were. Uppercase tracking,
gradients on controls and candy colours are out. The rule for anything
new: if it would look at home in a system settings screen, it is right.

**D38. The Sky tile is a star chart.** *Extends D17.* What it was for:
knowing what is above Brandeis right now. Layer 2 is now a chart of the
whole sky, zenith at the centre and horizon at the rim, drawn as seen
looking up: about 180 catalogued stars sized by brightness, figures for 34
constellations, the moon and planets, a compass rim. Collapsed, a small
chart plus the constellations highest up; expanded, the labelled chart,
the constellations and planets with direction and altitude, and sunrise,
sunset and moon phase. Layer 3 stays behind two buttons: the phone's
compass turns the chart to face the way you do, and "use my location"
recomputes the sky for where you are instead of campus. Both stay on the
phone. The catalog is from memory and good to a fraction of a degree; a
proper catalog can replace it without touching the chart.

**D39. The campus map is a tile.** *Settles the PRD's "map + photo
checkpoints".* A 1×1 Map tile shows a still of campus; expanded, a stylised
SVG map drawn from a fixture of building footprints, with pinch to zoom,
drag to pan and double-tap to step in. Zooming in reveals entrances, then
rooms and photo checkpoints, so the same map serves "where is Kutz" and
"which door". Footprints are rectangles from approximate coordinates and
need correcting against a real map; photos are added to the fixture as
they are taken. A real basemap was rejected: it needs a key, it does not
look like the rest of the app, and campus is small enough to draw.

**D40. Everything public is scraped; only what is gated waits on an ask.**
*Revises section 2 and the Phase 4 menu item.* A survey of the live
services found most of the data in the open: the dining site
(brandeishospitality.com) publishes each venue's hours for a date as data
attributes and each dining hall's menu as tabs of stations and items;
CSC's LaundryView has an unauthenticated JSON API listing every Brandeis
room and each machine's state; the library's LibCal hours API is public;
the CampusGroups school-wide calendar and the registrar's academic
calendar are public ICS feeds. The server scrapes all of these on a
schedule behind the same refresh cache as any feed, so a site change
degrades to the fixture, and each parser is tested against a saved copy
of the real page so the change shows up as a failing test. Still gated:
the TripShot shuttle feed, which has no public endpoint.

**D41. The map is aerial imagery, not drawn footprints.** *Revises D39.*
USGS National Map imagery is public domain and available as a single
export for a bounding box, so the campus is one 2048px JPEG in the bundle
with its exact Web Mercator extent recorded beside it. Names, entrances,
rooms and photo checkpoints are drawn over it by projecting their
coordinates; the footprint rectangles are no longer drawn. Setup is one
HTTP request, and the result looks like the place. Photo checkpoints for
a street-level "where do I go" view come later, as photos are taken.

**D42. The header's time of day is an arc, not a sentence.** A low arch
from sunrise to sunset with the sun where "now" falls; after sunset the
same arch runs moonrise to moonset with the moon, or sunset to the next
sunrise with a hollow marker when the moon is down. The times sit at the
ends and the sky's name ("Golden hour") between them. The owner asked for
a curved number line; the previous "Day · Sunrise 6:20 AM · Sunset 7:01 PM"
line said the same thing without showing where in the day you are.
Computed on device from the campus coordinate like the rest of D17.

## 2. Things that need access, and the seam each stops at

| Feature | Who to ask | What is built without them | What their answer unlocks |
|---|---|---|---|
| BranVan live positions | Transportation (TripShot GTFS-RT URL) | Full GTFS-RT parser and cache in Go, tested against MBTA's public feed; tile and expanded view against a fixture | Set one URL |
| Laundry | Nobody: CSC's LaundryView is public and scraped (D40) | Everything | Nothing |
| Campus events | Nobody: the CampusGroups and academic ICS feeds are public (D40) | Everything | Nothing |
| Study rooms | Library (LibCal API key) | Links to LibCal and 25Live; verify whether a public availability page exists | Native availability grid |
| Menus and hours | Nobody: brandeishospitality.com is scraped (D40); it can change or block | Scraper with fixture fallback, tested against a saved page | A vendor feed would remove the fragility |
| NFC card | Card vendor / Brandeis | Nothing | Link to mobile credential if it appears |

## 3. Build order

Phases 0 through 4 are built. The design pass (D35–D38) is applied across
them.

Each step ends with something a teammate can open. Steps within a phase can
run in parallel; phases mostly cannot.

### Phase 0: repository

- [ ] `app/` (Expo, TypeScript, Expo Router) and `server/` (Go) in one repo,
      one README that gets a teammate from clone to the web build in ten
      minutes (D23, D26).
- [ ] ESLint, TypeScript, Jest, `go vet` and `go test` in CI on every push
      (D34).
- [ ] Web build deployed by Cloudflare Pages on every push to main, with
      preview URLs on pull requests; that URL is the demo (D24).

### Phase 1: the grid, with nothing in it

- [x] `ExpandingTile` (D9, D27, D29) with a plain colored square: tap to
      expand, swipe down to collapse, on iOS, Android and web; capped width
      on desktop; each expanded tile is a route. This is the demo; do it
      first. Palette and type scale land here (D33). *Built on web; still
      to be felt on the owner's phone.*
- [x] Fixed grid with static spans and greedy gap fill (D8, D28), packing
      tested in Jest.
- [x] Long-press menu, hide, live drag with flow-around and flow-back
      (D11, D30).
- [x] Edit-mode gallery of hidden and available tiles; onboarding opens it.
- [x] Preferences store (D19, D31) persisting order, hidden set, promoted
      links, with the migration path tested.
- [x] Bottom bar: search pill and emergency button (D13). *Built; the
      one-handed reach test on the owner's phone is still owed.*

### Phase 2: chrome and static content

- [x] Emergency page with confirmed dials and share-location SMS (D14).
      *Numbers are in `app/src/fixtures/emergency.ts` and still need
      verifying; see section 4.*
- [x] Search fixture, fuzzy matching, three action kinds, chip row (D15).
- [x] Link tiles promotable from search and the gallery (D12).
- [x] Privacy, join the team, about with disclaimer (D22).
- [x] Ambient header from sunrise and sunset (D17 layer 1).

### Phase 3: backend and the source seam

- [x] Go server serving every fixture over HTTP; app sources fetch with
      fixture fallback (D5, D6). *Server deployment and the API URL are
      owner steps; see WIRING.md.*
- [x] Bug report endpoint, stored and emailed; Sentry and PostHog wired,
      privacy page updated to name them (D21). *Both SDKs are no-ops until
      their keys are set; SMTP is optional. See WIRING.md.*
- [x] Venue fixture: both dining halls, cafés, library, gym, the offices a
      student actually visits, with weekly hours (D16). *Hours unverified;
      see WIRING.md.*

### Phase 4: tiles with real behaviour

- [x] Hours tile with followed-venue preference and tabular expanded view.
- [x] Food tile with per-meal tables and the Grubhub link.
- [x] Menu scraper in Go, hourly, cached, falling back to the fixture.
      *Scrapes brandeishospitality.com (D40); hours for every venue too.*
- [x] Events tile; ICS fetcher and parser in Go; add-to-Google URL builder.
      *Both public feeds are the server's defaults (D40).*
- [x] Sky tile: dome with moon and planets (layer 2); "point your phone"
      orientation view behind a button (layer 3). *Layer 3 needs a real
      phone to test.*
- [x] Laundry tile with building preference; live from LaundryView (D40).
- [x] BranVan tile with home-stop preference, against a fixture; GTFS-RT
      parser and cache in Go tested against MBTA's public feed.

### Phase 5: accounts and the rest that needs nobody

- [x] Postgres; magic-link sign-in gated on brandeis.edu; preferences sync as
      one blob (D20). *Postgres, the app URL and the mail relay are owner
      steps; without them the server runs in memory and logs the links.*
- [x] Map framework: stylized SVG, zoom levels revealing entrances and rooms;
      photo checkpoints added as photos are taken (D39). *Footprints need
      correcting; see WIRING.md.*
- [x] Links to LibCal, 25Live and the facilities work-order form (Phase 2);
      native LibCal grid still waits on whether a public availability
      endpoint exists.
- [~] Store submission assets: icon without university marks, splash and
      favicon are done; screenshots need real devices; the privacy URL is
      the deployed /privacy route.

### Phase 6: asks

Only once the above is on a URL:

- [ ] Transportation: the GTFS-RT feed URL. Show them the tile working against
      MBTA data.
- [ ] Library: a LibCal key, if the public page was not enough.
- [ ] Student Affairs: a sponsor, continuity, and an introduction to the
      Branda team.

## 4. Open questions

Unchanged from the PRD, plus two the interview added:

- Room-booking vendor: LibCal for study rooms is confirmed; is there a
  public availability endpoint? (Dining is Brandeis Hospitality on
  brandeishospitality.com; laundry is CSC ServiceWorks on LaundryView;
  both are scraped, D40.)
- Will Transportation share the TripShot GTFS-RT feed?
- Does Brandeis plan to offer mobile credential for the new cards?
- Does LibCal expose a public availability endpoint for study rooms?

Added while building Phase 2, each a quick check against the live service:

- Are the emergency numbers in `app/src/fixtures/emergency.ts` right,
  especially the after-hours counseling line? Set `verified` to the date
  once confirmed.
- Are the vendor URLs marked VERIFY in `app/src/search/entries.ts` right
  (StarRez housing portal, Grubhub campus page, ReusePass, the OneSearch
  Primo view ID, the facilities work-order form)?
