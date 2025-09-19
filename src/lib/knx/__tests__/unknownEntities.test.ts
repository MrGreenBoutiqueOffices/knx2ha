import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";
import type { KnxCatalog } from "@/lib/types";

describe("unknown entities", () => {
  it("keeps unknown GA's and can drop reserve entries when requested", () => {
    const catalog: KnxCatalog = {
      project_name: "UnknownFixture",
      group_addresses: [
      {
        id: "ga-1",
        name: "Reserve",
        address: "5/0/1",
        dpt: "222.222",
      },
      {
        id: "ga-2",
        name: "Mystery Sensor",
        address: "5/0/2",
        dpt: "201.099",
      },
      ],
    };

    const entities = buildHaEntities(catalog);
    expect(entities.unknowns).toHaveLength(2);

    const reserveEntry = entities.unknowns.find(
      (entry) => entry.name === "Reserve"
    );
    const mysteryEntry = entities.unknowns.find(
      (entry) => entry.name === "Mystery Sensor"
    );

    expect(reserveEntry).toBeDefined();
    expect(mysteryEntry).toBeDefined();

    const filtered = buildHaEntities(catalog, { dropReserveFromUnknown: true });
    expect(filtered.unknowns).toHaveLength(1);
    expect(filtered.unknowns[0]?.name).toBe("Mystery Sensor");

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as {
      knx?: { _unknown?: Array<Record<string, unknown>> };
    };

    const section = (parsed.knx?._unknown ?? []) as Array<Record<string, unknown>>;
    const names = section
      .map((entry) => (typeof entry.name === "string" ? entry.name : undefined))
      .filter((name): name is string => Boolean(name));

    expect(names).toContain("Reserve");
    expect(names).toContain("Mystery Sensor");
  });
});
