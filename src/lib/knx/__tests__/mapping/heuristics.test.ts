import { describe, expect, it } from "@jest/globals";

import { guessEntityType, isLA } from "@/lib/knx/heuristics";

describe("heuristics", () => {
  it("detects LA-style names", () => {
    expect(isLA("LA1 Living Room")).toBe(true);
    expect(isLA("la12-Kitchen")).toBe(true);
    expect(isLA("Light 1")).toBe(false);
  });

  it("recognises KNX DPT based domains", () => {
    expect(guessEntityType("10.001", "Central time"))
      .toBe("time");
    expect(guessEntityType("11-1", "Central date")).toBe("date");
    expect(guessEntityType("19.001", "Main timestamp")).toBe("datetime");
    expect(guessEntityType("1.001", "Garage status")).toBe("binary_sensor");
    expect(guessEntityType("1.001", "Garden Pump")).toBe("switch");
    expect(guessEntityType("5.001", "LA1 Living Room")).toBe("light");
    expect(guessEntityType("5.001", "Rolluik keuken positie"))
      .toBe("cover");
    expect(guessEntityType("5.003", "Rolluik Lamel"))
      .toBe("cover");
    expect(guessEntityType("7.001", "Energy counter")).toBe("sensor");
  });

  it("falls back to name-based hints", () => {
    expect(guessEntityType(undefined, "Buitenlicht"))
      .toBe("light");
    expect(guessEntityType(undefined, "Rolluik woonkamer"))
      .toBe("cover");
    expect(guessEntityType(undefined, "Temperatuur woonkamer"))
      .toBe("sensor");
    expect(guessEntityType(undefined, "Main switch"))
      .toBe("switch");
    expect(guessEntityType(undefined, "Naamloos apparaat"))
      .toBe("unknown");
  });

  it("treats time DPT with switch hints as switch", () => {
    expect(guessEntityType("10.001", "Zonsopgang aan/uit"))
      .toBe("switch");
  });
});
