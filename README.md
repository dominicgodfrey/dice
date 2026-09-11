# Dice

A student app for Brandeis: one home screen of live, glanceable tiles, with
every other campus service one tap or one search away. Not affiliated with
Brandeis University or with Branda, the university's own app.

- [docs/PRD.md](docs/PRD.md) is what it is and who it is for.
- [docs/PLAN.md](docs/PLAN.md) is every decision, why it was made, the build
  order, and what still needs somebody's permission.

## Layout

- `app/` is the Expo app (TypeScript, Expo Router). One codebase for iOS,
  Android and web. The web build is the demo.
- `server/` is the Go backend. Serves fixtures over HTTP, runs the fetchers,
  takes bug reports.

## Run it

You need Node 24 and Go 1.26.

```bash
cd app && npm install && npm run web
```

```bash
cd server && go run .
```

The app opens at http://localhost:8081 and the server at
http://localhost:8080/healthz.

## Check it

```bash
cd app && npm run check
```

```bash
cd server && go vet ./... && go test ./...
```

CI runs the same on every push.

## Deploy

Cloudflare Pages builds the web app from `main` and every pull request.
Project settings: root directory `app`, build command
`npx expo export -p web`, output directory `dist`.
