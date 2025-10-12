import { describe, it, expect } from "@jest/globals";
import YAML from "yaml";
import type { KnxCatalog, KnxGroupAddressTree, KnxIndexes, KnxCatalogStats, KnxParseReport, KnxComObject, KnxDevice, KnxGroupAddress } from "@/lib/types";
import { toCatalogYaml } from "@/lib/knx/export";

describe("toCatalogYaml canonicalizes flag keys", () => {
  it("accepts alternative *Flag keys and outputs normalized booleans", () => {
    const tree: KnxGroupAddressTree = {
      mainGroups: [
        {
          id: "mg1",
          level: "main",
          name: "Main",
          children: [],
          items: [
            {
              id: "ga1",
              address: "1/0/1",
              name: "GA 1",
              datapointType: "1.001",
              // Provide flags using legacy key names
              flags: ({
                ReadFlag: true,
                WriteFlag: false,
                TransmitFlag: true,
                UpdateFlag: false,
                ReadOnInitFlag: true,
              } as unknown) as KnxGroupAddress["flags"],
            } as unknown as KnxGroupAddress,
          ],
        },
      ],
    } as KnxGroupAddressTree;

    const co: KnxComObject = {
      id: "co1",
      name: "Switch",
      number: 1,
      datapointType: "1.001",
      // Also test legacy keys at com object level
  flags: (({ ReadFlag: false, WriteFlag: true } as unknown) as KnxComObject["flags"]),
      groupAddressRefs: [],
    } as KnxComObject;

    const device: KnxDevice = {
      id: "dev1",
      name: "Test Device",
      channels: [
        {
          id: "ch1",
          name: "Channel",
          comObjects: [co],
        },
      ],
      comObjects: [],
    } as unknown as KnxDevice;

    const indexes: KnxIndexes = {
      groupAddressesById: { ga1: { id: "ga1", address: "1/0/1", name: "GA 1", datapointType: "1.001" } as KnxGroupAddress },
  comObjectsById: { co1: { id: "co1", datapointType: "1.001", groupAddressRefs: [], deviceId: "dev1", channelId: "ch1", flags: {} } as KnxComObject },
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
      meta: { name: "Flags Test" },
      topology: { areas: [] },
      devices: [device],
      groupAddresses: { tree, flat: [{ id: "ga1", address: "1/0/1", name: "GA 1", datapointType: "1.001" }] },
      indexes,
      stats,
      report,
      group_addresses: [],
    } as unknown as KnxCatalog;

    const yaml = toCatalogYaml(catalog);
    const parsed = YAML.parse(yaml);
    // GA item flags normalized
    const flags = parsed.group_addresses.tree[0].items[0].flags;
    expect(flags).toEqual({ read: true, write: false, transmit: true, update: false, readOnInit: true });
    // Com object flags normalized
    const coFlags = parsed.devices[0].channels[0].com_objects[0].flags;
    expect(coFlags.read).toBe(false);
    expect(coFlags.write).toBe(true);
  });
});
