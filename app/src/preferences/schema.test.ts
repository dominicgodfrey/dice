import { DEFAULT_PREFERENCES, PREFERENCES_VERSION, migrate } from "./schema";

describe("migrate", () => {
  it("returns defaults for nothing stored", () => {
    expect(migrate(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(migrate(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it("returns defaults for an unknown version", () => {
    expect(migrate({ version: 999, order: ["x"] })).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it("keeps current-version fields and fills in missing ones", () => {
    const result = migrate({
      version: PREFERENCES_VERSION,
      order: ["laundry", "food"],
    });
    expect(result.order).toEqual(["laundry", "food"]);
    expect(result.hidden).toEqual([]);
    expect(result.laundryBuilding).toBeNull();
  });
});
