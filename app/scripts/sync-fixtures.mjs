// Copies the server's fixtures into the app bundle (PLAN.md D6). The server
// is the source of truth; CI runs this and fails if the copies differ.
//
//   npm run sync-fixtures

import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, "../../server/fixtures");
const to = resolve(here, "../src/fixtures/data");

mkdirSync(to, { recursive: true });
const names = readdirSync(from).filter((f) => f.endsWith(".json"));
for (const name of names) copyFileSync(join(from, name), join(to, name));
console.log(`synced ${names.length} fixtures: ${names.join(", ")}`);
