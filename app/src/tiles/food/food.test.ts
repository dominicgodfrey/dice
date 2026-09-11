import type { Venue } from "../../sources/types";
import { mealAt, mealLine, mealsOn } from "./food";

const hall: Venue = {
  id: "h",
  name: "Hall",
  category: "dining",
  location: "",
  hours: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  meals: {
    weekday: [
      { name: "Breakfast", start: "07:30", end: "10:30" },
      { name: "Lunch", start: "11:00", end: "14:30" },
      { name: "Dinner", start: "16:30", end: "20:00" },
    ],
    weekend: [{ name: "Brunch", start: "10:00", end: "14:30" }],
  },
  exceptions: [],
};

const fri = (h: number, m = 0) => new Date(2026, 8, 11, h, m);
const sat = (h: number, m = 0) => new Date(2026, 8, 12, h, m);

describe("mealsOn", () => {
  it("picks weekday or weekend", () => {
    expect(mealsOn(hall, fri(12)).map((m) => m.name)).toEqual([
      "Breakfast",
      "Lunch",
      "Dinner",
    ]);
    expect(mealsOn(hall, sat(12)).map((m) => m.name)).toEqual(["Brunch"]);
  });
});

describe("mealAt", () => {
  it("finds the current meal", () => {
    const m = mealAt(hall, fri(12));
    expect(m.state).toBe("now");
    expect(mealLine(m)).toMatch(/^Lunch until /);
  });
  it("finds the next meal in a gap", () => {
    const m = mealAt(hall, fri(15));
    expect(m.state).toBe("next");
    expect(mealLine(m)).toMatch(/^Dinner at /);
  });
  it("is done after the last meal", () => {
    expect(mealLine(mealAt(hall, fri(21)))).toBe("Done for today");
  });
  it("handles a venue with no meals", () => {
    expect(mealAt({ ...hall, meals: undefined }, fri(12)).state).toBe("none");
  });
});
