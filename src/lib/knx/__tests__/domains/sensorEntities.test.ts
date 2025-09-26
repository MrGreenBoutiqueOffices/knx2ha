import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";

describe("sensor entities", () => {
  it("maps numeric GA's to HA sensors with correct type metadata", () => {
  const catalog = {
      project_name: "SensorFixture",
      group_addresses: [
      {
        id: "ga-1",
        name: "Outdoor Temperature",
        address: "4/0/1",
        dpt: "9.001",
      },
      {
        id: "ga-2",
        name: "Wind Speed",
        address: "4/0/2",
        dpt: "9.005",
      },
      {
        id: "ga-3",
        name: "Energy Counter",
        address: "4/0/3",
        dpt: "12.001",
      },
      ],
    };

    const entities = buildHaEntities(catalog);

    expect(entities.sensors).toHaveLength(3);
    const byName = new Map(entities.sensors.map((s) => [s.name, s]));

    expect(byName.get("Outdoor Temperature")?.state_address).toBe("4/0/1");
    expect(byName.get("Outdoor Temperature")?.type).toBe("temperature");

    expect(byName.get("Wind Speed")?.state_address).toBe("4/0/2");
    expect(byName.get("Wind Speed")?.type).toBe("wind_speed_ms");

    expect(byName.get("Energy Counter")?.state_address).toBe("4/0/3");
    expect(byName.get("Energy Counter")?.type).toBe("pulse_4_ucount");

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as {
      knx?: { sensor?: Array<Record<string, unknown>> };
    };

    const section = (parsed.knx?.sensor ?? []) as Array<Record<string, unknown>>;
    const types = section.map((entry) => entry.type);
    expect(types).toContain("temperature");
    expect(types).toContain("wind_speed_ms");
    expect(types).toContain("pulse_4_ucount");
  });
});
