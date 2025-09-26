import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";

describe("switch entities", () => {
  it("aggregates switching groups into Home Assistant switches", () => {
  const catalog = {
      project_name: "SwitchFixture",
      group_addresses: [
      {
        id: "ga-1",
        name: "Server Rack Aan/Uit",
        address: "1/0/1",
        dpt: "1.001",
      },
      {
        id: "ga-2",
        name: "Server Rack Status",
        address: "1/5/1",
        dpt: "1.001",
      },
      {
        id: "ga-3",
        name: "Garden Pump",
        address: "2/0/1",
        dpt: "1.001",
      },
      ],
    };

    const entities = buildHaEntities(catalog);

    expect(entities.switches).toHaveLength(2);

    const rackSwitch = entities.switches.find(
      (entry) => entry.name === "Server Rack Aan/Uit"
    );
    expect(rackSwitch).toBeDefined();
    expect(rackSwitch?.address).toBe("1/0/1");
    expect(rackSwitch?.state_address).toBe("1/5/1");
    expect(rackSwitch?.respond_to_read).toBeUndefined();

    const pumpSwitch = entities.switches.find(
      (entry) => entry.name === "Garden Pump"
    );
    expect(pumpSwitch).toBeDefined();
    expect(pumpSwitch?.address).toBe("2/0/1");
    expect(pumpSwitch?.state_address).toBeUndefined();
    expect(pumpSwitch?.respond_to_read).toBe(true);

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as {
      knx?: { switch?: Array<Record<string, unknown>> };
    };

    const switchSection = (parsed.knx?.switch ?? []) as Array<
      Record<string, unknown>
    >;

    const byName = (name: string) =>
      switchSection.find(
        (entry) => typeof entry.name === "string" && entry.name === name
      );

    const rackYaml = byName("Server Rack Aan/Uit");
    expect(rackYaml).toBeDefined();
    expect(
      typeof rackYaml?.address === "string" ? rackYaml.address : undefined,
    ).toBe("1/0/1");
    expect(
      typeof rackYaml?.state_address === "string"
        ? rackYaml.state_address
        : undefined,
    ).toBe("1/5/1");

    const pumpYaml = byName("Garden Pump");
    expect(pumpYaml).toBeDefined();
    expect(
      typeof pumpYaml?.address === "string" ? pumpYaml.address : undefined,
    ).toBe("2/0/1");
    expect(pumpYaml?.respond_to_read).toBe(true);
  });
});
