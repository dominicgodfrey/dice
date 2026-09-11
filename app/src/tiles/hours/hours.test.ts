import type { Venue } from "../../sources/types";
import {
  followedIds,
  intervalsAround,
  rangesOn,
  statusAt,
  statusLabel,
  toggleFollowed,
} from "./hours";

// 2026-09-11 is a Friday.
const fri = (h: number, m = 0) => new Date(2026, 8, 11, h, m);
const sat = (h: number, m = 0) => new Date(2026, 8, 12, h, m);

const venue: Venue = {
  id: "v",
  name: "V",
  category: "cafe",
  location: "",
  hours: {
    mon: [["09:00", "17:00"]],
    tue: [["09:00", "17:00"]],
    wed: [["09:00", "17:00"]],
    thu: [["09:00", "17:00"]],
    // Friday: two ranges, the second past midnight.
    fri: [
      ["08:00", "12:00"],
      ["18:00", "01:00"],
    ],
    sat: [],
    sun: [["10:00", "16:00"]],
  },
  exceptions: [{ date: "2026-09-13", hours: [], note: "Closed Sunday" }],
};

describe("rangesOn", () => {
  it("uses the weekday ranges and honours exceptions", () => {
    expect(rangesOn(venue, fri(12))).toHaveLength(2);
    expect(rangesOn(venue, new Date(2026, 8, 13, 12))).toEqual([]);
  });
});

describe("intervalsAround", () => {
  it("runs a past-midnight range into the next day", () => {
    const late = intervalsAround(venue, fri(20)).find(
      (i) => i.start.getTime() === fri(18).getTime(),
    );
    expect(late?.end.getTime()).toBe(sat(1).getTime());
  });
});

describe("statusAt", () => {
  it("is open inside a range and reports the close", () => {
    const s = statusAt(venue, fri(10));
    expect(s.open).toBe(true);
    expect(s.until?.getTime()).toBe(fri(12).getTime());
  });
  it("is closed between ranges and reports the next open", () => {
    const s = statusAt(venue, fri(13));
    expect(s.open).toBe(false);
    expect(s.until?.getTime()).toBe(fri(18).getTime());
  });
  it("is still open at 12:30 AM from Friday's late range", () => {
    const s = statusAt(venue, sat(0, 30));
    expect(s.open).toBe(true);
    expect(s.until?.getTime()).toBe(sat(1).getTime());
  });
  it("looks past a closed day and an exception for the next open", () => {
    const s = statusAt(venue, sat(3));
    expect(s.open).toBe(false);
    // Saturday closed, Sunday closed by exception, so Monday 9:00.
    expect(s.until?.getTime()).toBe(new Date(2026, 8, 14, 9).getTime());
  });
});

describe("statusLabel", () => {
  it("phrases open, closed today, and closed until another day", () => {
    expect(statusLabel(statusAt(venue, fri(10)), fri(10))).toMatch(/^Closes /);
    expect(statusLabel(statusAt(venue, fri(13)), fri(13))).toMatch(/^Opens \d/);
    expect(statusLabel(statusAt(venue, sat(3)), sat(3))).toMatch(/^Opens Mon /);
    expect(statusLabel({ open: false, until: null }, fri(1))).toBe("Closed");
  });
});

describe("followed venues", () => {
  it("defaults when empty and toggles", () => {
    expect(followedIds({ followedVenues: [] })).toContain("sherman");
    const off = toggleFollowed({ followedVenues: [] }, "sherman");
    expect(off.followedVenues).not.toContain("sherman");
    expect(off.followedVenues).toContain("usdan");
    const on = toggleFollowed(off, "sherman");
    expect(on.followedVenues).toContain("sherman");
  });
});
