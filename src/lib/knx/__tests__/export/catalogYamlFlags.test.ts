import { describe, it, expect } from "@jest/globals";
import YAML from "yaml";
import type { KnxCatalog, KnxComObject, KnxDevice, KnxGroupAddress, KnxGroupAddressTree, KnxIndexes, KnxCatalogStats, KnxParseReport } from "@/lib/types";
import { toCatalogYaml } from "@/lib/knx/export";

function ga(id: string, address: string, name?: string, datapointType?: string): KnxGroupAddress {
  return { id, address, name, datapointType };
}

describe("toCatalogYaml flags & summary", () => {
  it("includes flags as booleans and a basic summary", () => {
    const comObjects: KnxComObject[] = [
      {
        id: "co1",
        name: "On/Off",
        number: 1,
        datapointType: "1.001",
        flags: { read: true, write: true, transmit: false, update: false, readOnInit: false },
        groupAddressRefs: [],
      },
    ];
    const device: KnxDevice = {
      id: "dev1",
      name: "Switch Actor",
      description: "A test device",
      manufacturerRef: "ACME",
      channels: [],
      comObjects,
    };

    const tree: KnxGroupAddressTree = {
      mainGroups: [
        {
          id: "mg1",
          level: "main",
          name: "Main",
          children: [],
          items: [ga("ga1", "1/0/0", "GA 1", "1.001")],
        },
      ],
    };

    const indexes: KnxIndexes = {
      groupAddressesById: { ga1: { id: "ga1", address: "1/0/0", name: "GA 1" } as unknown as KnxGroupAddress },
      comObjectsById: { co1: { id: "co1", datapointType: "1.001", flags: {}, groupAddressRefs: [], deviceId: "dev1" } as unknown as KnxComObject },
      devicesById: { dev1: device },
    } as unknown as KnxIndexes;

    const stats: KnxCatalogStats = {
      totals: { groupAddresses: 1, devices: 1, comObjects: 1 },
      dptUsage: { "1.001": 1 },
      secure: { hasSecure: false, secureGroupAddressCount: 0 },
    };

    const report: KnxParseReport = {
      missingDatapointTypes: { groupAddresses: [], comObjects: [] },
      roleUnknown: [],
      datapointConflicts: [],
      duplicateBindings: [],
      secureHints: { hasSecure: false, details: [] },
      parsingNotes: [],
    };

    const catalog: KnxCatalog = {
      meta: { name: "TestProj", etsVersion: "6" },
      topology: { areas: [] },
      devices: [device],
      groupAddresses: { tree, flat: [ga("ga1", "1/0/0", "GA 1", "1.001")] },
      indexes,
      stats,
      report,
      group_addresses: [{ id: "ga1", address: "1/0/0", name: "GA 1", dpt: "1.001" }],
    };

    const yaml = toCatalogYaml(catalog);
    const parsed = YAML.parse(yaml);

  expect(parsed.stats.totals.devices).toBeGreaterThanOrEqual(1);
  expect(parsed.stats.totals.groupAddresses).toBeGreaterThanOrEqual(1);

    const dev = parsed.devices[0];
    expect(dev.com_objects[0].flags.read).toBe(true);
    expect(dev.com_objects[0].flags.transmit).toBe(false);
  });
});
