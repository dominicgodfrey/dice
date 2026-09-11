// Posts a bug report to the backend (PLAN.md D21).

import { apiBase } from "./client";

export type BugReport = {
  message: string;
  email?: string;
  context?: Record<string, string>;
  sentryEventId?: string;
};

export type BugReportResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: "no-server" | "rejected" | "network";
      detail?: string;
    };

export async function sendBugReport(
  report: BugReport,
): Promise<BugReportResult> {
  const base = apiBase();
  if (!base) return { ok: false, reason: "no-server" };
  try {
    const res = await fetch(`${base}/api/v1/bug-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: "rejected",
        detail: (await res.text()).trim(),
      };
    }
    const body = (await res.json()) as { id?: string };
    return { ok: true, id: body.id ?? "" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
