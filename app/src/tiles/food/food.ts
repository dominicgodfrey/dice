// Which meal a dining hall is serving now (PLAN.md D16). Pure; tested.

import type { Meal, Venue } from "../../sources/types";
import { atClock, formatClock, isWeekend, localDateKey } from "../../util/time";

export function mealsOn(venue: Venue, day: Date): Meal[] {
  if (venue.todayMeals && venue.todayDate === localDateKey(day)) {
    return venue.todayMeals;
  }
  if (!venue.meals) return [];
  return isWeekend(day) ? venue.meals.weekend : venue.meals.weekday;
}

export type MealNow =
  | { state: "now"; meal: Meal; until: Date }
  | { state: "next"; meal: Meal; at: Date }
  | { state: "done" }
  | { state: "none" };

export function mealAt(venue: Venue, now: Date): MealNow {
  const meals = mealsOn(venue, now);
  if (meals.length === 0) return { state: "none" };
  for (const meal of meals) {
    const start = atClock(now, meal.start);
    const end = atClock(now, meal.end);
    if (start <= now && now < end) return { state: "now", meal, until: end };
    if (now < start) return { state: "next", meal, at: start };
  }
  return { state: "done" };
}

/** "Dinner until 8:00 PM", "Lunch at 11:00 AM", "Done for today". */
export function mealLine(m: MealNow): string {
  switch (m.state) {
    case "now":
      return `${m.meal.name} until ${formatClock(m.until)}`;
    case "next":
      return `${m.meal.name} at ${formatClock(m.at)}`;
    case "done":
      return "Done for today";
    case "none":
      return "No meals listed";
  }
}
