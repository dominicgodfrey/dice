import type { CampusEvent } from "../../sources/types";
import {
  googleCalendarUrl,
  groupByDay,
  isAllDay,
  upcoming,
  whenLabel,
} from "./events";

const now = new Date(2026, 8, 11, 9, 0); // Fri 9:00 local
const ev = (
  id: string,
  start: Date,
  end: Date,
  extra: Partial<CampusEvent> = {},
): CampusEvent => ({
  id,
  title: id,
  start: start.toISOString(),
  end: end.toISOString(),
  location: "",
  category: "campus",
  url: "",
  ...extra,
});
const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m);

const events = [
  ev("past", at(10, 10), at(10, 11)),
  ev("later-today", at(11, 14), at(11, 16)),
  ev("now", at(11, 8), at(11, 10)),
  ev("tomorrow", at(12, 19), at(12, 21)),
  ev("allday", at(15, 0), at(15, 23, 59)),
  ev("far", at(30, 12), at(30, 13)),
];

describe("upcoming", () => {
  it("drops finished events and sorts by start", () => {
    expect(upcoming(events, now).map((e) => e.id)).toEqual([
      "now",
      "later-today",
      "tomorrow",
      "allday",
      "far",
    ]);
  });
});

describe("isAllDay and whenLabel", () => {
  it("detects all-day and phrases days", () => {
    expect(isAllDay(events[4])).toBe(true);
    expect(isAllDay(events[1])).toBe(false);
    expect(whenLabel(events[1], now)).toMatch(/^Today · /);
    expect(whenLabel(events[3], now)).toMatch(/^Tomorrow · /);
    expect(whenLabel(events[4], now)).toMatch(/Tue/);
    expect(whenLabel(events[4], now)).toMatch(/15/);
  });
});

describe("groupByDay", () => {
  it("groups the week and leaves out the far future", () => {
    const g = groupByDay(events, now);
    expect(g.map((x) => x.label).slice(0, 2)).toEqual(["Today", "Tomorrow"]);
    expect(g[2].label).toMatch(/Tue/);
    expect(g[0].events.map((e) => e.id)).toEqual(["now", "later-today"]);
  });
});

describe("googleCalendarUrl", () => {
  it("builds a timed template", () => {
    const url = googleCalendarUrl(
      ev("x", at(11, 14), at(11, 16), {
        title: "Club Fair",
        location: "Great Lawn",
      }),
    );
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Club+Fair");
    expect(url).toContain("location=Great+Lawn");
    expect(url).toMatch(/dates=\d{8}T\d{6}Z%2F\d{8}T\d{6}Z/);
  });
  it("builds an all-day template with exclusive end", () => {
    const url = googleCalendarUrl(events[4]);
    expect(url).toContain("dates=20260915%2F20260916");
  });
});
