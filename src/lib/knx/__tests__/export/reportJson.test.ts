import { describe, it, expect } from "@jest/globals";
import { toReportJson } from "@/lib/knx/export";
import type { KnxCatalog, KnxGroupAddressTree, KnxIndexes, KnxCatalogStats, KnxParseReport } from "@/lib/types";

function minimalCatalog(): KnxCatalog {
  const tree: KnxGroupAddressTree = { mainGroups: [] };
  const indexes: KnxIndexes = {
    groupAddressesById: {},
    comObjectsById: {},
    devicesById: {},
  } as KnxIndexes;
  const stats: KnxCatalogStats = {
    totals: { groupAddresses: 0, devices: 0, comObjects: 0 },
    dptUsage: {},
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
  return {
    meta: { name: "Empty" },
    topology: { areas: [] },
    devices: [],
    groupAddresses: { tree, flat: [] },
    indexes,
    stats,
    report,
    group_addresses: [],
  };
}

describe("toReportJson", () => {
  it("serializes the report JSON", () => {
    const json = toReportJson(minimalCatalog());
    const obj = JSON.parse(json);
    expect(obj).toHaveProperty("missingDatapointTypes");
    expect(obj).toHaveProperty("parsingNotes");
  });
});
