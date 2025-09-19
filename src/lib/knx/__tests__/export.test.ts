import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import {
  buildHaEntities,
  haEntitiesToYaml,
  summarizeEntities,
  toCatalogYaml,
  toHomeAssistantYaml,
} from "@/lib/knx/export";
import type { KnxCatalog } from "@/lib/types";

describe("export helpers", () => {
  const catalog: KnxCatalog = {
    project_name: "Export Fixture",
    group_addresses: [
      {
        id: "ga-1",
        name: "LA1 Woonkamer",
        address: "1/1/1",
        dpt: "1.001",
        description: "Light",
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
        address: "1/3/1",
        dpt: "5.001",
      },
      {
        id: "ga-4",
        name: "General Switch",
        address: "2/0/1",
        dpt: "1.001",
      },
      {
        id: "ga-5",
        name: "General Switch Status",
        address: "2/0/2",
        dpt: "1.001",
      },
      {
        id: "ga-6",
        name: "Outdoor Temperature",
        address: "3/0/1",
        dpt: "9.001",
      },
      {
        id: "ga-7",
        name: "Reserve",
        address: "4/0/1",
        dpt: "999.999",
        description: "Reserve",
      },
      {
        id: "ga-8",
        name: "Central Time",
        address: "5/0/1",
        dpt: "10.001",
      },
    ],
  };

  it("builds Home Assistant entities with reserve filtering", () => {
    const allEntities = buildHaEntities(catalog);
    expect(allEntities.switches).toHaveLength(2);
    const switchNames = allEntities.switches.map((entry) => entry.name);
    expect(switchNames).toEqual([
      "LA1 Woonkamer",
      "General Switch",
    ]);
    expect(allEntities.lights).toHaveLength(1);
    expect(allEntities.sensors).toHaveLength(1);
    expect(allEntities.times).toHaveLength(1);
    expect(allEntities.unknowns).toHaveLength(1);

    const filtered = buildHaEntities(catalog, { dropReserveFromUnknown: true });
    expect(filtered.unknowns).toHaveLength(0);
  });

  it("converts entities to YAML with quoted addresses", () => {
    const entities = buildHaEntities(catalog);
    const yamlString = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yamlString);

    const switchAddresses = parsed.knx.switch.map(
      (entry: { address: string }) => entry.address
    );
    expect(switchAddresses).toEqual(["1/1/1", "2/0/1"]);
    const switchStates = parsed.knx.switch.map(
      (entry: { state_address?: string }) => entry.state_address
    );
    expect(switchStates).toEqual([undefined, "2/0/2"]);
    expect(parsed.knx.light[0].address).toBe("1/1/1");
    expect(parsed.knx.sensor[0].state_address).toBe("3/0/1");
    expect(parsed.knx.time[0].state_address).toBe("5/0/1");
    expect(parsed.knx._unknown[0].name).toBe("Reserve");
  });

  it("summarizes entity counts and sensor types", () => {
    const entities = buildHaEntities(catalog);
    const summary = summarizeEntities(entities);

    expect(summary.counts.switch).toBe(2);
    expect(summary.counts.light).toBe(1);
    expect(summary.counts.sensor).toBe(1);
    expect(summary.counts.time).toBe(1);
    expect(summary.counts._unknown).toBe(1);
    expect(summary.counts.total).toBe(6);
    expect(summary.sensorsByType.temperature).toBe(1);
  });

  it("generates Home Assistant YAML in one step", () => {
    const yamlString = toHomeAssistantYaml(catalog, {
      dropReserveFromUnknown: true,
    });
    const parsed = YAML.parse(yamlString);
    const addresses = parsed.knx.switch.map((entry: { address: string }) => entry.address);
    expect(addresses).toEqual(["1/1/1", "2/0/1"]);
    expect(parsed.knx._unknown).toBeUndefined();
  });

  it("serializes catalog to YAML with metadata", () => {
    const catalogYaml = toCatalogYaml(catalog);
    const restored = YAML.parse(catalogYaml);
    expect(restored.project_name).toBe("Export Fixture");
    expect(restored.group_addresses[0].description).toBe("Light");
    expect(restored.group_addresses).toHaveLength(8);
  });
});
