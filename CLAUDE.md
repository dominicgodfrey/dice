# Dice

Read `docs/HANDOFF.md` first: state of the project, conventions, and what
is verified. Decisions and their reasons are numbered in `docs/PLAN.md`;
cite them by number. `docs/WIRING.md` is the list of things only the owner
can do; keep it current when work creates or removes one.

Rules that matter here:

- Fixtures live in `server/fixtures`; run `npm run sync-fixtures` in `app/`
  after editing one. CI checks the copies match.
- The Expo lint config runs the React Compiler rules. Never write a
  Reanimated shared value from an effect or read one in an effect's
  dependencies; mutate only in gesture and animation callbacks. See
  `app/src/expand/ExpandProvider.tsx` for the pattern that passes.
- Use `app/src/ui/Text` and `app/src/ui/Icon`, never raw `Text` or emoji.
- Run `npx prettier --write src app` in `app/` before committing.
- `npm run check` in `app/` and `go vet ./... && go test ./...` in
  `server/` must pass; that is what CI runs.
- Commits are atomic, with no Claude co-author line. Push when asked.
