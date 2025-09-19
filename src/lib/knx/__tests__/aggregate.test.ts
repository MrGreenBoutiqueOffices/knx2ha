import { describe, expect, it } from "@jest/globals";

import {
  buildLaLightAggregates,
  buildSwitchAggregates,
  buildCoverAggregates,
  collectConsumedIds,
  dptToSensorType,
  mapSingleGaToEntity,
} from "@/lib/knx/aggregate";
import type { GroupAddress } from "@/lib/types";

describe("aggregate helpers", () => {
  it("groups LA* light addresses into a single aggregate", () => {
    const gas: GroupAddress[] = [
      {
        id: "ga-1",
        name: "LA1 Woonkamer",
        address: "1/1/1",
        dpt: "1.001",
      },
      {
        id: "ga-2",
        name: "LA1 Woonkamer",
        address: "1/5/1",
        dpt: "1.001",
      },
      {
        id: "ga-3",
        name: "LA1 Woonkamer",
        address: "1/2/1",
        dpt: "3.007",
      },
      {
        id: "ga-4",
        name: "LA1 Woonkamer",
        address: "1/3/1",
        dpt: "5.001",
      },
      {
        id: "ga-5",
        name: "LA1 Woonkamer",
        address: "1/4/1",
        dpt: "5.001",
      },
    ];

    const aggregates = buildLaLightAggregates(gas);

    expect(aggregates).toHaveLength(1);
    const agg = aggregates[0];
    expect(agg.name).toBe("LA1 Woonkamer");
    expect(agg.on_off).toBe("1/1/1");
    expect(agg.on_off_state).toBe("1/5/1");
    expect(agg.dimming).toBe("1/2/1");
    expect(agg.brightness).toBe("1/3/1");
    expect(agg.brightness_state).toBe("1/4/1");
    expect(Array.from(agg.consumedIds)).toEqual([
      "ga-1",
      "ga-2",
      "ga-3",
      "ga-4",
      "ga-5",
    ]);
  });

  it("pairs command and status GA's into switch aggregates", () => {
    const gas: GroupAddress[] = [
      {
        id: "ga-10",
        name: "Server Rack Aan/Uit",
        address: "2/1/0",
        dpt: "1.001",
      },
      {
        id: "ga-11",
        name: "Server Rack Status",
        address: "2/1/1",
        dpt: "1.001",
      },
      {
        id: "ga-12",
        name: "Garden Pump",
        address: "2/2/0",
        dpt: "1.001",
      },
    ];

    const aggregates = buildSwitchAggregates(gas);
    expect(aggregates).toHaveLength(2);

    const rack = aggregates.find((agg) => agg.name === "Server Rack Aan/Uit");
    expect(rack?.address).toBe("2/1/0");
    expect(rack?.state_address).toBe("2/1/1");

    const pump = aggregates.find((agg) => agg.name === "Garden Pump");
    expect(pump?.address).toBe("2/2/0");
    expect(pump?.state_address).toBeUndefined();

    const consumed = collectConsumedIds(aggregates);
    expect(consumed.has("ga-10")).toBe(true);
    expect(consumed.has("ga-11")).toBe(true);
    expect(consumed.has("ga-12")).toBe(true);
  });

  it("drops switch aggregates that only contain status addresses", () => {
    const gas: GroupAddress[] = [
      {
        id: "ga-13",
        name: "Server Rack Status",
        address: "5/1/1",
        dpt: "1.001",
      },
    ];

    const aggregates = buildSwitchAggregates(gas);
    expect(aggregates).toHaveLength(0);
  });

  it("combines cover movement, position and invert hints", () => {
    const gas: GroupAddress[] = [
      {
        id: "ga-20",
        name: "Rolluik Keuken Lang",
        address: "3/1/0",
        dpt: "1.008",
      },
      {
        id: "ga-21",
        name: "Rolluik Keuken Kort",
        address: "3/1/1",
        dpt: "1.007",
      },
      {
        id: "ga-22",
        name: "Rolluik Keuken Stop",
        address: "3/1/2",
        dpt: "1.010",
      },
      {
        id: "ga-23",
        name: "Rolluik Keuken Positie",
        address: "3/2/0",
        dpt: "5.001",
      },
      {
        id: "ga-24",
        name: "Rolluik Keuken Positie Status",
        address: "3/2/1",
        dpt: "5.001",
      },
      {
        id: "ga-25",
        name: "Rolluik Keuken Lamel",
        address: "3/3/0",
        dpt: "5.003",
      },
      {
        id: "ga-26",
        name: "Rolluik Keuken Lamel Status",
        address: "3/3/1",
        dpt: "5.003",
      },
      {
        id: "ga-27",
        name: "Rolluik Keuken Positie invert",
        address: "3/4/0",
        dpt: "5.001",
      },
      {
        id: "ga-28",
        name: "Rolluik Keuken Lamel invert",
        address: "3/4/1",
        dpt: "5.003",
      },
    ];

    const aggregates = buildCoverAggregates(gas);
    expect(aggregates).toHaveLength(2);

    const motionCover = aggregates.find(
      (entry) => entry.name === "Rolluik Keuken Lang"
    );
    expect(motionCover).toBeDefined();
    expect(motionCover?.move_long_address).toBe("3/1/0");
    expect(motionCover?.move_short_address).toBe("3/1/1");
    expect(motionCover?.stop_address).toBe("3/1/2");
    expect(motionCover?.position_address).toBe("3/2/0");
    expect(motionCover?.position_state_address).toBe("3/2/1");
    expect(motionCover?.angle_address).toBe("3/3/0");
    expect(motionCover?.angle_state_address).toBe("3/3/1");
    expect(motionCover?.invert_position).toBeUndefined();
    expect(motionCover?.invert_angle).toBeUndefined();

    const invertCover = aggregates.find((entry) =>
      entry.name?.toLowerCase().includes("invert")
    );
    expect(invertCover).toBeDefined();
    expect(invertCover?.position_address).toBe("3/4/0");
    expect(invertCover?.angle_address).toBe("3/4/1");
    expect(invertCover?.invert_position).toBe(true);
    expect(invertCover?.invert_angle).toBe(true);
  });

  it("maps DPT codes and name hints to sensor types", () => {
    expect(dptToSensorType("9.001", "Outside temperature")).toBe(
      "temperature"
    );
    expect(dptToSensorType("9", "Generic float")).toBe("2byte_float");
    expect(dptToSensorType(undefined, "Luchtdruk sensor")).toBe(
      "pressure_2byte"
    );
    expect(dptToSensorType("10.001", "Central Time")).toBeUndefined();
  });

  it("collects consumed ids from multiple aggregate groups", () => {
    const a = [{ consumedIds: new Set(["a1", "a2"]) }];
    const b = [{ consumedIds: new Set(["b1"]) }, { consumedIds: new Set(["b2"]) }];

    const merged = collectConsumedIds(a, b);
    expect(Array.from(merged).sort()).toEqual(["a1", "a2", "b1", "b2"]);
  });

  it("maps single group addresses to matching HA payloads", () => {
    const timeGa: GroupAddress = {
      id: "ga-101",
      name: "Central Time",
      address: "6/0/1",
      dpt: "10.001",
    };
    const timeMapped = mapSingleGaToEntity(timeGa);
    expect(timeMapped.domain).toBe("time");
    expect(timeMapped.payload).toEqual({
      name: "Central Time",
      address: "6/0/1",
      state_address: "6/0/1",
    });

    const coverGa: GroupAddress = {
      id: "ga-102",
      name: "Rolluik Balkon Positie invert",
      address: "6/1/0",
      dpt: "5.001",
    };
    const coverMapped = mapSingleGaToEntity(coverGa);
    expect(coverMapped.domain).toBe("cover");
    expect(coverMapped.payload).toEqual({
      name: "Rolluik Balkon Positie invert",
      position_address: "6/1/0",
      invert_position: true,
    });

    const unknownGa: GroupAddress = {
      id: "ga-103",
      name: "Mystery GA",
      address: "6/2/0",
      dpt: "999.999",
    };
    const unknownMapped = mapSingleGaToEntity(unknownGa);
    expect(unknownMapped.domain).toBe("_unknown");
    expect(unknownMapped.payload).toEqual({
      name: "Mystery GA",
      address: "6/2/0",
      dpt: "999.999",
    });

    const sensorGa: GroupAddress = {
      id: "ga-104",
      name: "Buitentemperatuur",
      address: "6/3/0",
      dpt: "9.001",
    };
    const sensorMapped = mapSingleGaToEntity(sensorGa);
    expect(sensorMapped.domain).toBe("sensor");
    expect(sensorMapped.payload).toEqual({
      name: "Buitentemperatuur",
      state_address: "6/3/0",
      type: "temperature",
    });

    const binarySensorGa: GroupAddress = {
      id: "ga-105",
      name: "Deur Status",
      address: "6/4/0",
      dpt: "1.001",
    };
    const binaryMapped = mapSingleGaToEntity(binarySensorGa);
    expect(binaryMapped.domain).toBe("binary_sensor");
    expect(binaryMapped.payload).toEqual({
      name: "Deur Status",
      state_address: "6/4/0",
    });
  });
});
