import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";
import type { KnxCatalog } from "@/lib/types";

describe("light entities", () => {
  it("merges LA light groups into full-featured Home Assistant lights", () => {
    const catalog: KnxCatalog = {
      project_name: "LightFixture",
      group_addresses: [
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
      ],
    };

    const entities = buildHaEntities(catalog);

    expect(entities.lights).toHaveLength(1);
    const light = entities.lights[0];
    expect(light.name).toBe("LA1 Woonkamer");
    expect(light.address).toBe("1/1/1");
    expect(light.state_address).toBe("1/5/1");
    expect(light.brightness_address).toBe("1/3/1");
    expect(light.brightness_state_address).toBe("1/4/1");

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as {
      knx?: { light?: Array<Record<string, unknown>> };
    };

    const section = (parsed.knx?.light ?? []) as Array<Record<string, unknown>>;
    expect(section).toHaveLength(1);
    const entry = section[0];

    const readString = (key: string) => {
      const value = entry[key];
      return typeof value === "string" ? value : undefined;
    };

    expect(readString("name")).toBe("LA1 Woonkamer");
    expect(readString("address")).toBe("1/1/1");
    expect(readString("state_address")).toBe("1/5/1");
    expect(readString("brightness_address")).toBe("1/3/1");
    expect(readString("brightness_state_address")).toBe("1/4/1");
  });
});
