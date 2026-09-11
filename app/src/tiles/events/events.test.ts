import type { CampusEvent } from "../../sources/types";
import {
  addMonths,
  eventsOn,
  googleCalendarUrl,
  groupByDay,
  isAllDay,
  monthGrid,
  upcoming,
  weekLabel,
  weekOf,
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

describe("ongoing events", () => {
  const long = ev("long", at(1, 19), at(30, 21));
  it("sit under Today, not their start day", () => {
    const g = groupByDay([...events, long], now);
    expect(g[0].label).toBe("Today");
    expect(g[0].events.map((e) => e.id)).toContain("long");
    expect(
      g.some(
        (x) => x.label !== "Today" && x.events.some((e) => e.id === "long"),
      ),
    ).toBe(false);
  });
  it("say when they end rather than when they began", () => {
    expect(whenLabel(long, now)).toBe("Today · until 9:00 PM");
  });
});

describe("eventsOn", () => {
  it("includes anything touching the day, in start order", () => {
    const ids = eventsOn(events, at(11, 12)).map((e) => e.id);
    expect(ids).not.toContain("past");
    expect(ids).toContain("later-today");
    expect(ids).toEqual(
      [...ids].sort((a, b) => {
        const s = (id: string) =>
          new Date(events.find((e) => e.id === id)!.start).getTime();
        return s(a) - s(b);
      }),
    );
    expect(eventsOn(events, at(10, 12)).map((e) => e.id)).toContain("past");
  });
});

describe("weekOf and monthGrid", () => {
  it("runs Sunday to Saturday around the day", () => {
    const w = weekOf(at(11, 12)); // Friday 2026-09-11
    expect(w[0].getDay()).toBe(0);
    expect(w[0].getDate()).toBe(6);
    expect(w[6].getDate()).toBe(12);
  });
  it("covers the whole month in full weeks", () => {
    const g = monthGrid(at(11, 12)); // September 2026 starts on a Tuesday
    expect(g.length).toBe(5);
    expect(g[0][0].getDate()).toBe(30); // Aug 30
    expect(g[0][2].getDate()).toBe(1);
    expect(g[4][6].getDate()).toBe(3); // Oct 3
    for (const week of g) expect(week.length).toBe(7);
  });
  it("labels a week that crosses a month", () => {
    expect(weekLabel(at(11, 12))).toBe("Sep 6 – 12");
    expect(weekLabel(new Date(2026, 8, 1))).toBe("Aug 30 – Sep 5");
  });
});

describe("addMonths", () => {
  it("clamps to the shorter month", () => {
    expect(addMonths(new Date(2026, 0, 31), 1).getDate()).toBe(28);
    expect(addMonths(new Date(2026, 8, 11), -1).getMonth()).toBe(7);
    expect(addMonths(new Date(2026, 11, 11), 1).getFullYear()).toBe(2027);
  });
});
