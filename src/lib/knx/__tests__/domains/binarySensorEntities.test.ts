import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";

describe("binary sensor entities", () => {
  it("maps status-like GA's to binary sensors", () => {
  const catalog = {
      project_name: "BinarySensorFixture",
      group_addresses: [
      {
        id: "ga-1",
        name: "Front Door Status",
        address: "1/0/2",
        dpt: "1.001",
      },
      {
        id: "ga-2",
        name: "Garage Window Status",
        address: "1/0/3",
        dpt: "1.001",
      },
      ],
    };

    const entities = buildHaEntities(catalog);

    expect(entities.binarySensors).toHaveLength(2);
    expect(entities.switches).toHaveLength(0);

    const door = entities.binarySensors.find(
      (entry) => entry.name === "Front Door Status"
    );
    expect(door).toBeDefined();
    expect(door?.state_address).toBe("1/0/2");

    const window = entities.binarySensors.find(
      (entry) => entry.name === "Garage Window Status"
    );
    expect(window).toBeDefined();
    expect(window?.state_address).toBe("1/0/3");

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as {
      knx?: { binary_sensor?: Array<Record<string, unknown>> };
    };

    const section = (parsed.knx?.binary_sensor ?? []) as Array<
      Record<string, unknown>
    >;
    expect(section).toHaveLength(2);

    const stateAddresses = section.map((entry) => entry.state_address);
    expect(stateAddresses).toContain("1/0/2");
    expect(stateAddresses).toContain("1/0/3");
  });
});
