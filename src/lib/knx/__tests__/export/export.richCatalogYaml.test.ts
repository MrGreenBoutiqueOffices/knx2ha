import { describe, it, expect } from "@jest/globals";
import YAML from "yaml";
import type { KnxCatalog, KnxGroupAddress, KnxComObject, KnxDevice } from "@/lib/types";
import { toCatalogYaml } from "@/lib/knx/export";

function makeRichCatalog(): KnxCatalog {
  const catalog: KnxCatalog = {
    meta: { name: "Rich Project", etsVersion: "ETS6", createdAt: "2025-01-01", modifiedAt: "2025-01-02" },
    topology: {
      areas: [
        { id: "area-1", name: "Area 1", lines: [ { id: "line-1", name: "Line 1", devices: [] } ] },
      ],
    },
    devices: [
      {
        id: "dev-1",
        name: "Device 1",
        address: "1.1.1",
        manufacturerRef: "man-1",
        applicationProgramRef: "app-1",
        parameters: { mode: "auto" },
        channels: [
          {
            id: "ch-1",
            name: "Ch 1",
            comObjects: [
              {
                id: "co-1",
                name: "Switch",
                number: 1,
                datapointType: "1.001",
                bitLength: 1,
                flags: { read: true, write: true, transmit: false, update: false, readOnInit: false },
                groupAddressRefs: [ { role: "write", groupAddressId: "ga-1" } ],
                channelId: "ch-1",
                deviceId: "dev-1",
              },
            ],
          },
        ],
        comObjects: [],
      },
    ],
    groupAddresses: {
      tree: { mainGroups: [ { id: "mg-1", name: "Main", level: "main", children: [], items: [
        { id: "ga-1", address: "1/1/1", name: "Switch 1", description: "desc", datapointType: "1.001", flags: { read: true }, priority: "Low" },
      ] } ] },
      flat: [ { id: "ga-1", address: "1/1/1", name: "Switch 1", datapointType: "1.001" } ],
    },
    indexes: {
      groupAddressesById: {
        "ga-1": { id: "ga-1", address: "1/1/1", name: "Switch 1", datapointType: "1.001" } as KnxGroupAddress,
      },
      comObjectsById: {
        "co-1": {
          id: "co-1",
          deviceId: "dev-1",
          channelId: "ch-1",
          datapointType: "1.001",
          name: "Switch",
          number: 1,
          flags: {},
          groupAddressRefs: [],
        } as KnxComObject,
      },
      devicesById: {
        "dev-1": { id: "dev-1", name: "Device 1", address: "1.1.1", channels: [], comObjects: [] } as KnxDevice,
      },
    },
    stats: {
      totals: { groupAddresses: 1, devices: 1, comObjects: 1 },
      dptUsage: { "1.001": 1 },
      secure: { hasSecure: false, secureGroupAddressCount: 0 },
    },
    report: {
      missingDatapointTypes: { groupAddresses: [], comObjects: [] },
      roleUnknown: [],
      datapointConflicts: [],
      duplicateBindings: [],
      secureHints: { hasSecure: false, details: [] },
      parsingNotes: [],
    },
    group_addresses: [ { id: "ga-1", name: "Switch 1", address: "1/1/1", dpt: "1.001" } ],
    links: [],
  };
  return catalog;
}

describe("toCatalogYaml with rich catalog", () => {
  it("emits detailed sections for rich catalogs", () => {
    const yaml = toCatalogYaml(makeRichCatalog());
    const parsed = YAML.parse(yaml);
    expect(parsed.meta.project_name).toBe("Rich Project");
    expect(parsed.topology.areas[0].lines[0].devices_count).toBe(0);
    expect(parsed.group_addresses.tree[0].items[0].address).toBe("1/1/1");
    expect(parsed.devices[0].channels[0].com_objects[0].dpt).toBe("1.001");
    expect(parsed.devices[0].channels[0].com_objects[0].group_address_refs[0].group_address_id).toBe("ga-1");
    expect(parsed.indexes.group_addresses_by_id["ga-1"].address).toBe("1/1/1");
    expect(parsed.stats.totals.groupAddresses).toBe(1);
  });
});
