// The one place the app talks to the backend (PLAN.md D5, D6). Every
// source fetches through `fetchWithFallback`, which returns the bundled
// fixture whenever the server is unreachable, slow, or returns something
// that fails the shape check. A tile therefore degrades to stale, never to
// blank.

export type Origin = "server" | "fixture";

export type Sourced<T> = { data: T; origin: Origin; fetchedAt: Date };

const TIMEOUT_MS = 5000;

/**
 * Where the backend is. EXPO_PUBLIC_API_URL is read at build time by Expo.
 * Unset means fixtures only, which is what a static demo without a server
 * gets; in development it defaults to a local server.
 */
export function apiBase(): string | null {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  return __DEV__ ? "http://localhost:8080" : null;
}

export async function fetchWithFallback<T>(
  path: string,
  fallback: T,
  isValid: (v: unknown) => v is T,
  base: string | null = apiBase(),
): Promise<Sourced<T>> {
  const fromFixture = (): Sourced<T> => ({
    data: fallback,
    origin: "fixture",
    fetchedAt: new Date(),
  });
  if (!base) return fromFixture();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fromFixture();
    const body: unknown = await res.json();
    if (!isValid(body)) return fromFixture();
    return { data: body, origin: "server", fetchedAt: new Date() };
  } catch {
    return fromFixture();
  } finally {
    clearTimeout(timer);
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** A cheap shape check: an object with the listed array fields. */
export function hasArrays(v: unknown, ...keys: string[]): boolean {
  return isRecord(v) && keys.every((k) => Array.isArray(v[k]));
}
