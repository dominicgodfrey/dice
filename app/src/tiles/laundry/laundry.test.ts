import type { Machine } from "../../sources/types";
import {
  countMachines,
  countsLine,
  machineLabel,
  noConnection,
  systemDown,
} from "./laundry";

const m = (
  type: Machine["type"],
  status: Machine["status"],
  minutesLeft: number | null = null,
): Machine => ({ id: `${type}-${Math.random()}`, type, status, minutesLeft });

describe("countMachines", () => {
  it("counts free machines and ignores broken ones", () => {
    const c = countMachines([
      m("washer", "available"),
      m("washer", "in_use", 14),
      m("washer", "out_of_order"),
      m("dryer", "in_use", 32),
      m("dryer", "in_use", 5),
    ]);
    expect(c).toEqual({
      washersFree: 1,
      dryersFree: 0,
      washers: 2,
      dryers: 2,
      nextWasher: 14,
      nextDryer: 5,
      offline: 0,
    });
  });

  it("counts offline machines separately", () => {
    const c = countMachines([m("washer", "offline"), m("dryer", "offline")]);
    expect(c.washers).toBe(0);
    expect(c.dryers).toBe(0);
    expect(c.offline).toBe(2);
  });
});

describe("countsLine", () => {
  it("pluralises and handles zero", () => {
    expect(
      countsLine(
        countMachines([
          m("washer", "available"),
          m("dryer", "available"),
          m("dryer", "available"),
        ]),
      ),
    ).toBe("1 washer · 2 dryers free");
    expect(countsLine(countMachines([m("washer", "in_use", 3)]))).toBe(
      "No washers · no dryers free",
    );
  });

  it("says when every machine is broken", () => {
    expect(
      countsLine(
        countMachines([
          m("washer", "out_of_order"),
          m("dryer", "out_of_order"),
        ]),
      ),
    ).toBe("All out of order");
    expect(countsLine(countMachines([]))).toBe("All out of order");
  });

  it("says when the room is not reporting", () => {
    expect(
      countsLine(
        countMachines([m("washer", "offline"), m("dryer", "offline")]),
      ),
    ).toBe("Not reporting");
    expect(
      countsLine(
        countMachines([m("washer", "offline"), m("dryer", "available")]),
      ),
    ).toBe("No washers · 1 dryer free");
  });
});

describe("noConnection", () => {
  it("is true only when nothing is free or running", () => {
    expect(noConnection(countMachines([m("washer", "offline")]))).toBe(true);
    expect(noConnection(countMachines([m("dryer", "out_of_order")]))).toBe(
      true,
    );
    expect(noConnection(countMachines([m("washer", "in_use", 3)]))).toBe(false);
  });
});

describe("systemDown", () => {
  const building = (...machines: Machine[]) => ({
    id: "b",
    name: "B",
    rooms: [{ id: "r", name: "R", machines }],
  });
  it("is down only when nothing anywhere reports a working machine", () => {
    expect(systemDown([building(m("washer", "offline"))])).toBe(true);
    expect(
      systemDown([
        building(m("washer", "offline")),
        building(m("dryer", "out_of_order")),
      ]),
    ).toBe(true);
    expect(
      systemDown([
        building(m("washer", "offline")),
        building(m("dryer", "in_use", 4)),
      ]),
    ).toBe(false);
    expect(systemDown([])).toBe(false);
  });
});

describe("machineLabel", () => {
  it("describes each state", () => {
    expect(machineLabel(m("washer", "available"))).toBe("Free");
    expect(machineLabel(m("washer", "in_use", 7))).toBe("7 min left");
    expect(machineLabel(m("washer", "in_use"))).toBe("In use");
    expect(machineLabel(m("dryer", "out_of_order"))).toBe("Out of order");
    expect(machineLabel(m("dryer", "offline"))).toBe("Not reporting");
  });
});
