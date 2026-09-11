// Sentry and PostHog behind keys (PLAN.md D21). With no key set, every
// function here is a no-op, so the app runs identically without accounts.
// Keys arrive through EXPO_PUBLIC_SENTRY_DSN, EXPO_PUBLIC_POSTHOG_KEY and
// EXPO_PUBLIC_POSTHOG_HOST; see docs/WIRING.md.

import * as Sentry from "@sentry/react-native";
import PostHog from "posthog-react-native";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export const sentryEnabled = Boolean(SENTRY_DSN);
export const posthogEnabled = Boolean(POSTHOG_KEY);

let posthog: PostHog | null = null;

/** Call once, before the first render. */
export function initObservability(): void {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      // Errors and sessions only. No performance tracing, no replays.
      tracesSampleRate: 0,
      enableAutoSessionTracking: true,
      sendDefaultPii: false,
    });
  }
  if (POSTHOG_KEY) {
    posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Explicit events only; no autocapture, no session recording.
      captureAppLifecycleEvents: true,
    });
  }
}

/** A named product event with flat properties. */
export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  posthog?.capture(event, props);
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!sentryEnabled) return;
  Sentry.captureException(error, { extra: context });
}

/** Records a message and returns its event ID so a bug report can cite it. */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): string | null {
  if (!sentryEnabled) return null;
  return Sentry.captureMessage(message, { level: "info", extra: context });
}

/** Breadcrumb for the route the student is on; attached to later events. */
export function noteRoute(pathname: string): void {
  if (sentryEnabled) {
    Sentry.addBreadcrumb({
      category: "navigation",
      message: pathname,
      level: "info",
    });
  }
  posthog?.screen(pathname);
}
