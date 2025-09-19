import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";
import type { KnxCatalog } from "@/lib/types";

describe("time/date entities", () => {
  it("maps DPT 10/11/19 to dedicated time domains", () => {
    const catalog: KnxCatalog = {
      project_name: "Fixture",
      group_addresses: [
        {
          id: "ga-1",
          name: "Central Time",
          address: "1/0/1",
          dpt: "10.001",
        },
        {
          id: "ga-2",
          name: "Central Date",
          address: "1/0/2",
          dpt: "11.001",
        },
        {
          id: "ga-3",
          name: "Central DateTime",
          address: "1/0/3",
          dpt: "19.001",
        },
        {
          id: "ga-4",
          name: "Outdoor Temperature",
          address: "2/0/1",
          dpt: "9.001",
        },
        {
          id: "ga-5",
          name: "General - Zone klep 1 t/m 8 aan/uit",
          address: "3/0/0",
          dpt: "10.001",
        },
      ],
    };

    const entities = buildHaEntities(catalog);

    expect(entities.times).toHaveLength(1);
    expect(entities.times[0]).toEqual({
      name: "Central Time",
      address: "1/0/1",
      state_address: "1/0/1",
    });

    expect(entities.dates).toHaveLength(1);
    expect(entities.dates[0]).toEqual({
      name: "Central Date",
      address: "1/0/2",
      state_address: "1/0/2",
    });

    expect(entities.datetimes).toHaveLength(1);
    expect(entities.datetimes[0]).toEqual({
      name: "Central DateTime",
      address: "1/0/3",
      state_address: "1/0/3",
    });

    expect(entities.sensors).toHaveLength(1);
    expect(entities.sensors[0]?.state_address).toBe("2/0/1");

    expect(entities.switches).toHaveLength(1);
    expect(entities.switches[0]).toEqual({
      name: "General - Zone klep 1 t/m 8 aan/uit",
      address: "3/0/0",
    });

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as {
      knx: Record<string, Array<Record<string, unknown>>>;
    };

    const timeSection = parsed.knx?.time ?? [];
    const dateSection = parsed.knx?.date ?? [];
    const datetimeSection = parsed.knx?.datetime ?? [];
    const sensorSection = parsed.knx?.sensor ?? [];
    const switchSection = parsed.knx?.switch ?? [];

    const stateAddresses = (entries: Array<Record<string, unknown>>) =>
      entries
        .map((entry) =>
          typeof entry.state_address === "string"
            ? entry.state_address
            : undefined
        )
        .filter((addr): addr is string => Boolean(addr));

    const switchAddresses = switchSection
      .map((entry) =>
        typeof entry.address === "string" ? entry.address : undefined
      )
      .filter((addr): addr is string => Boolean(addr));

    expect(stateAddresses(timeSection)).toEqual(["1/0/1"]);
    expect(stateAddresses(dateSection)).toEqual(["1/0/2"]);
    expect(stateAddresses(datetimeSection)).toEqual(["1/0/3"]);

    const sensorAddresses = stateAddresses(sensorSection);
    expect(sensorAddresses).not.toContain("1/0/1");
    expect(sensorAddresses).not.toContain("1/0/2");
    expect(sensorAddresses).not.toContain("1/0/3");
    expect(stateAddresses(timeSection)).not.toContain("3/0/0");
    expect(switchAddresses).toContain("3/0/0");
  });
});
