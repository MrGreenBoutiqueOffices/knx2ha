import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";

describe("scene entities", () => {
  it("maps GA's to HA scenes using DPT and name hints", () => {
  const catalog = {
      project_name: "SceneFixture",
      group_addresses: [
        { id: "ga-1", name: "Scene 01", address: "1/7/1", dpt: "18.001" },
        { id: "ga-2", name: "Szene 5", address: "1/7/2", dpt: "1.001" },
        { id: "ga-3", name: "Normal Switch", address: "1/7/3", dpt: "1.001" },
      ],
    };

    const entities = buildHaEntities(catalog);

    expect(entities.scenes).toHaveLength(2);
    const byAddr = new Map(entities.scenes.map((s) => [s.address, s]));
    expect(byAddr.get("1/7/1")?.scene_number).toBe(1);
    expect(byAddr.get("1/7/2")?.scene_number).toBe(5);

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as { knx?: { scene?: Array<Record<string, unknown>> } };
    const section = parsed.knx?.scene ?? [];
    const addresses = (section as Array<Record<string, unknown>>).map((e) => e.address);
    expect(addresses).toContain("1/7/1");
    expect(addresses).toContain("1/7/2");
  });
});
