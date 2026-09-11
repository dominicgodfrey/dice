# Wiring: things only you can do

The running list of accounts, keys, dashboard steps and checks that the
code cannot do for itself. Each item says what unlocks when it is done.
Tick items here as you do them; the code side of each is already built.

## Now

- [ ] **Connect Cloudflare Pages** to `github.com/dominicgodfrey/dice`.
      Root directory `app`, build command `npx expo export -p web`, output
      directory `dist`, preview deployments on. Unlocks: the demo URL and a
      preview link per pull request (D24).
- [ ] **Open the deployed URL on your phone.** Judge the expansion
      animation (D9 has a cheap fallback if it does not feel right) and
      whether the SOS button is reachable one-handed without being hit by
      accident (D13). Tell me which, if either, needs changing.

## Backend

- [ ] **Pick a host for the Go server** and deploy it. The `server/`
      directory has a Dockerfile; Fly.io, Railway, Render or any small VPS
      works. Environment variables it reads:

      | Variable | Purpose | Default |
      |---|---|---|
      | `PORT` | listen port | `8080` |
      | `ALLOWED_ORIGINS` | comma-separated CORS origins | `*` |
      | `BUG_REPORT_DIR` | where reports are written; mount a volume | `./data/bug-reports` |
      | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | relay for emailing reports | unset: store only |
      | `BUG_REPORT_FROM`, `BUG_REPORT_TO` | sender and team inbox | unset: store only |

      Unlocks: fixtures served over HTTP to the demo, bug reports from the
      demo, and later the fetchers (Phase 4) and accounts (Phase 5).
- [ ] **Set `EXPO_PUBLIC_API_URL`** in the Cloudflare Pages build
      environment to the server's public URL, then redeploy. Until then the
      web demo runs on bundled fixtures and the bug form says so.
- [ ] **Set `ALLOWED_ORIGINS`** on the server to the Pages hostname(s)
      once you know them, instead of `*`.
- [ ] **A transactional email account** for the bug report emails (Resend,
      Postmark, Mailgun, or any SMTP relay; free tiers are enough). Put its
      SMTP credentials in the server environment above. The same account
      sends the magic links in Phase 5.

## Observability (PLAN.md D21)

- [ ] **Sentry.** Create a project of type React Native at sentry.io, copy
      the DSN, set `EXPO_PUBLIC_SENTRY_DSN` in the Pages build environment
      and in a local `app/.env.local`. Unlocks: crash reports; bug reports
      that cite the Sentry event with device, route and breadcrumbs. Later,
      for native builds and readable stack traces, add the organisation and
      project slugs to the `@sentry/react-native` plugin entry in
      `app/app.json` and a `SENTRY_AUTH_TOKEN` in the build environment.
- [ ] **PostHog.** Create a project at posthog.com, copy the project API
      key, set `EXPO_PUBLIC_POSTHOG_KEY` (and `EXPO_PUBLIC_POSTHOG_HOST` if
      not the US cloud). Unlocks: screen views and named events. Autocapture
      and session recording are off in code and the privacy page says so.

## Verify against the live services

Each is a few minutes against the real site. The code marks each spot.

- [ ] **Emergency numbers** in `app/src/fixtures/emergency.ts`, especially
      the after-hours counselling line. Set `verified` to the date.
- [ ] **Vendor URLs** marked VERIFY in `app/src/search/entries.ts`: the
      StarRez housing portal, the Grubhub campus page, ReusePass, the
      OneSearch Primo view ID, the facilities work-order form.
- [ ] **Venue hours** in `server/fixtures/venues.json`. Every entry is a
      best guess. Set `verified` to true when checked; add any venue I
      missed. After editing, run `npm run sync-fixtures` in `app/`.

## Before students see it

- [ ] **Domain**, if you want one instead of the `pages.dev` hostname.
      Point it at Pages; put the API on a subdomain of it.

## Asks that need a person (PLAN.md section 2 and phase 6)

Only once the above is on a URL:

- [ ] Transportation: the TripShot GTFS-RT feed URL.
- [ ] Laundry vendor: an endpoint (first find out which vendor).
- [ ] Library: a LibCal key, if the public availability page is not enough.
- [ ] Student Affairs: a sponsor and an introduction to the Branda team.
- [ ] CampusGroups: check whether the events ICS is public or per-user.
