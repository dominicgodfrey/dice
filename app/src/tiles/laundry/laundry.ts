// Laundry counts (PLAN.md D18). Pure; tested.

import type { LaundryBuilding, Machine } from "../../sources/types";

export type Counts = {
  washersFree: number;
  dryersFree: number;
  washers: number;
  dryers: number;
  /** Soonest machine to finish, in minutes, if none is free of that type. */
  nextWasher: number | null;
  nextDryer: number | null;
};

export function countMachines(machines: readonly Machine[]): Counts {
  const c: Counts = {
    washersFree: 0,
    dryersFree: 0,
    washers: 0,
    dryers: 0,
    nextWasher: null,
    nextDryer: null,
  };
  for (const m of machines) {
    if (m.status === "out_of_order") continue;
    const isWasher = m.type === "washer";
    if (isWasher) c.washers++;
    else c.dryers++;
    if (m.status === "available") {
      if (isWasher) c.washersFree++;
      else c.dryersFree++;
    } else if (m.minutesLeft !== null) {
      if (isWasher)
        c.nextWasher = Math.min(c.nextWasher ?? Infinity, m.minutesLeft);
      else c.nextDryer = Math.min(c.nextDryer ?? Infinity, m.minutesLeft);
    }
  }
  return c;
}

export function countBuilding(b: LaundryBuilding): Counts {
  return countMachines(b.rooms.flatMap((r) => r.machines));
}

/** "3 washers · 1 dryer free" or "No washers · 2 dryers free". */
export function countsLine(c: Counts): string {
  const w =
    c.washersFree === 0
      ? "No washers"
      : `${c.washersFree} washer${c.washersFree === 1 ? "" : "s"}`;
  const d =
    c.dryersFree === 0
      ? "no dryers"
      : `${c.dryersFree} dryer${c.dryersFree === 1 ? "" : "s"}`;
  return `${w} · ${d} free`;
}

export function machineLabel(m: Machine): string {
  if (m.status === "out_of_order") return "Out of order";
  if (m.status === "available") return "Free";
  return m.minutesLeft === null ? "In use" : `${m.minutesLeft} min left`;
}
