// Calls to the accounts API (PLAN.md D20).

import { apiBase } from "../sources/client";

export type RequestResult =
  { ok: true; link?: string } | { ok: false; error: string };

export type Session = { token: string; email: string; expires: string };

async function readError(res: Response, fallback: string): Promise<string> {
  const text = (await res.text()).trim();
  return text || fallback;
}

export async function requestLink(email: string): Promise<RequestResult> {
  const base = apiBase();
  if (!base)
    return { ok: false, error: "This build has no server configured." };
  try {
    const res = await fetch(`${base}/api/v1/auth/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok)
      return {
        ok: false,
        error: await readError(res, "Could not send the link."),
      };
    const body = (await res.json()) as { link?: string };
    return { ok: true, link: body.link };
  } catch {
    return { ok: false, error: "Could not reach the server." };
  }
}

export async function verifyToken(
  token: string,
): Promise<Session | { error: string }> {
  const base = apiBase();
  if (!base) return { error: "This build has no server configured." };
  try {
    const res = await fetch(`${base}/api/v1/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok)
      return { error: await readError(res, "That link did not work.") };
    return (await res.json()) as Session;
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function whoAmI(token: string): Promise<{ email: string } | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as { email: string };
  } catch {
    return null;
  }
}

export async function signOutRemote(token: string): Promise<void> {
  const base = apiBase();
  if (!base) return;
  try {
    await fetch(`${base}/api/v1/auth/signout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Local sign-out proceeds regardless.
  }
}

/** The stored blob, null when the account has none yet, undefined on failure. */
export async function pullPreferences(
  token: string,
): Promise<unknown | null | undefined> {
  const base = apiBase();
  if (!base) return undefined;
  try {
    const res = await fetch(`${base}/api/v1/preferences`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return (await res.json()) as unknown;
  } catch {
    return undefined;
  }
}

export async function pushPreferences(
  token: string,
  blob: string,
): Promise<boolean> {
  const base = apiBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/api/v1/preferences`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: blob,
    });
    return res.ok;
  } catch {
    return false;
  }
}
