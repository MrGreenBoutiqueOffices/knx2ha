import { describe, expect, it } from "@jest/globals";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";

describe("cover entities", () => {
  it("collects cover commands, feedback and invert hints into a single cover", () => {
  const catalog = {
      project_name: "CoverFixture",
      group_addresses: [
      {
        id: "ga-1",
        name: "Rolluik Keuken Lang",
        address: "2/1/1",
        dpt: "1.008",
      },
      {
        id: "ga-2",
        name: "Rolluik Keuken Kort",
        address: "2/2/1",
        dpt: "1.007",
      },
      {
        id: "ga-3",
        name: "Rolluik Keuken Stop",
        address: "2/1/2",
        dpt: "1.010",
      },
      {
        id: "ga-4",
        name: "Rolluik Keuken Positie",
        address: "2/3/1",
        dpt: "5.001",
      },
      {
        id: "ga-5",
        name: "Rolluik Keuken Positie Status",
        address: "2/5/1",
        dpt: "5.001",
      },
      {
        id: "ga-6",
        name: "Rolluik Keuken Lamel",
        address: "2/3/2",
        dpt: "5.003",
      },
      {
        id: "ga-7",
        name: "Rolluik Keuken Lamel Status",
        address: "2/5/2",
        dpt: "5.003",
      },
      {
        id: "ga-8",
        name: "Rolluik Keuken Positie invert",
        address: "2/4/1",
        dpt: "5.001",
      },
      {
        id: "ga-9",
        name: "Rolluik Keuken Lamel invert",
        address: "2/4/2",
        dpt: "5.003",
      },
      ],
    };

    const entities = buildHaEntities(catalog);

    expect(entities.covers).toHaveLength(2);

    const primary = entities.covers.find(
      (entry) => entry.name === "Rolluik Keuken Lang"
    );
    expect(primary).toBeDefined();
    expect(primary?.move_long_address).toBe("2/1/1");
    expect(primary?.move_short_address).toBe("2/2/1");
    expect(primary?.stop_address).toBe("2/1/2");
    expect(primary?.position_address).toBe("2/3/1");
    expect(primary?.position_state_address).toBe("2/5/1");
    expect(primary?.angle_address).toBe("2/3/2");
    expect(primary?.angle_state_address).toBe("2/5/2");
    expect(primary?.invert_position).toBeUndefined();
    expect(primary?.invert_angle).toBeUndefined();

    const invertCover = entities.covers.find((entry) =>
      entry.name?.toLowerCase().includes("invert")
    );
    expect(invertCover).toBeDefined();
    expect(invertCover?.position_address).toBe("2/4/1");
    expect(invertCover?.angle_address).toBe("2/4/2");
    expect(invertCover?.invert_position).toBe(true);
    expect(invertCover?.invert_angle).toBe(true);

    const yaml = haEntitiesToYaml(entities);
    const parsed = YAML.parse(yaml) as {
      knx?: { cover?: Array<Record<string, unknown>> };
    };

    const section = (parsed.knx?.cover ?? []) as Array<Record<string, unknown>>;
    expect(section).toHaveLength(2);

    const byName = (name: string) =>
      section.find(
        (entry) => typeof entry.name === "string" && entry.name === name
      );

    const yamlPrimary = byName("Rolluik Keuken Lang");
    expect(yamlPrimary).toBeDefined();
    expect(yamlPrimary?.move_long_address).toBe("2/1/1");
    expect(yamlPrimary?.move_short_address).toBe("2/2/1");
    expect(yamlPrimary?.stop_address).toBe("2/1/2");
    expect(yamlPrimary?.position_address).toBe("2/3/1");
    expect(yamlPrimary?.position_state_address).toBe("2/5/1");
    expect(yamlPrimary?.angle_address).toBe("2/3/2");
    expect(yamlPrimary?.angle_state_address).toBe("2/5/2");
    expect(yamlPrimary?.invert_position).toBeUndefined();
    expect(yamlPrimary?.invert_angle).toBeUndefined();

    const yamlInvert = section.find((entry) =>
      typeof entry.name === "string" && entry.name.toLowerCase().includes("invert")
    );
    expect(yamlInvert).toBeDefined();
    expect(yamlInvert?.position_address).toBe("2/4/1");
    expect(yamlInvert?.angle_address).toBe("2/4/2");
    expect(yamlInvert?.invert_position).toBe(true);
    expect(yamlInvert?.invert_angle).toBe(true);
  });
});
