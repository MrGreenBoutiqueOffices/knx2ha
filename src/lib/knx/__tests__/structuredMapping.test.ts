import { describe, expect, it } from "@jest/globals";
import { buildHaEntities } from "@/lib/knx/export";
import type { KnxCatalog, KnxDevice, KnxChannel, KnxComObject, KnxGroupAddress } from "@/lib/types";

function makeGa(id: string, address: string, dpt: string, name?: string): KnxGroupAddress {
  return {
    id,
    address,
    name,
    datapointType: dpt,
  } as KnxGroupAddress;
}

function makeCatalog({
  gas,
  devices,
}: {
  gas: KnxGroupAddress[];
  devices: Array<{
    id: string;
    name?: string;
    channels: Array<{
      id: string;
      name?: string;
      comObjects: Array<{
        id: string;
        name?: string;
        dpt?: string;
        flags?: Partial<import("@/lib/types").KnxFlags>;
        bindings: Array<{ role: import("@/lib/types").KnxGroupObjectRole; gaId: string }>;
      }>;
    }>;
  }>;
}): KnxCatalog {
  const devicesOut: KnxDevice[] = devices.map((d) => ({
    id: d.id,
    name: d.name,
    address: "1.1.1",
    channels: d.channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      comObjects: ch.comObjects.map((co) => ({
        id: co.id,
        name: co.name,
        datapointType: co.dpt,
        flags: {
          read: co.flags?.read ?? false,
          write: co.flags?.write ?? false,
          transmit: co.flags?.transmit ?? false,
          update: co.flags?.update ?? false,
        },
        groupAddressRefs: co.bindings.map((b) => ({
          role: b.role,
          groupAddressId: b.gaId,
        })),
      } as KnxComObject)),
    } as KnxChannel)),
    comObjects: [],
  } as KnxDevice));

  const groupAddressesById = Object.fromEntries(gas.map((g) => [g.id, g]));
  const comObjectsById: Record<string, KnxComObject> = {};
  for (const d of devicesOut) {
    for (const ch of d.channels) {
      for (const co of ch.comObjects) {
        comObjectsById[co.id] = { ...co, channelId: ch.id, deviceId: d.id } as KnxComObject;
      }
    }
  }

  const catalog: KnxCatalog = {
    meta: { name: "Fixture" },
    topology: { areas: [] },
    devices: devicesOut,
    groupAddresses: {
      tree: { mainGroups: [] },
      flat: gas,
    },
    indexes: {
      groupAddressesById,
      comObjectsById,
      devicesById: Object.fromEntries(devicesOut.map((d) => [d.id, d])),
    },
    stats: {
      totals: { groupAddresses: gas.length, devices: devicesOut.length, comObjects: Object.keys(comObjectsById).length },
      dptUsage: {},
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
    // Legacy compat (not used in rich path)
    group_addresses: gas.map((g) => ({ id: g.id, name: g.name ?? "", address: g.address, dpt: g.datapointType })),
  } as unknown as KnxCatalog;

  return catalog;
}

describe("structured mapping (devices/channels/com objects)", () => {
  it("emits a single light per channel when brightness write (5.xxx) exists and consumes related on/off", () => {
    const gaOn = makeGa("ga1", "1/1/1", "1.001", "Light On");
    const gaOnState = makeGa("ga2", "1/5/1", "1.001", "Light State");
    const gaBright = makeGa("ga3", "1/3/1", "5.001", "Light Brightness");
    const gaBrightState = makeGa("ga4", "1/4/1", "5.001", "Light Brightness State");

    const catalog = makeCatalog({
      gas: [gaOn, gaOnState, gaBright, gaBrightState],
      devices: [
        {
          id: "dev1",
          name: "Actuator",
          channels: [
            {
              id: "ch1",
              name: "Living Room Light",
              comObjects: [
                {
                  id: "co1",
                  name: "OnOff",
                  dpt: "1.001",
                  flags: { write: true, read: true },
                  bindings: [
                    { role: "write", gaId: gaOn.id },
                    { role: "state", gaId: gaOnState.id },
                  ],
                },
                {
                  id: "co2",
                  name: "Dim",
                  dpt: "5.001",
                  flags: { write: true, read: true },
                  bindings: [
                    { role: "write", gaId: gaBright.id },
                    { role: "state", gaId: gaBrightState.id },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const ent = buildHaEntities(catalog);
    expect(ent.lights).toHaveLength(1);
    expect(ent.switches).toHaveLength(0); // on/off consumed by the light
    const light = ent.lights[0];
    expect(light.address).toBe("1/1/1");
    expect(light.state_address).toBe("1/5/1");
    expect(light.brightness_address).toBe("1/3/1");
    expect(light.brightness_state_address).toBe("1/4/1");
  });

  it("emits a switch when only on/off (1.xxx) exists without brightness", () => {
    const gaOn = makeGa("ga5", "1/1/2", "1.001", "Light 2 On");
    const gaOnState = makeGa("ga6", "1/5/2", "1.001", "Light 2 State");

    const catalog = makeCatalog({
      gas: [gaOn, gaOnState],
      devices: [
        {
          id: "dev1",
          channels: [
            {
              id: "ch2",
              name: "Another Light",
              comObjects: [
                {
                  id: "co3",
                  name: "OnOff",
                  dpt: "1.001",
                  flags: { write: true, read: true },
                  bindings: [
                    { role: "write", gaId: gaOn.id },
                    { role: "state", gaId: gaOnState.id },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const ent = buildHaEntities(catalog);
    expect(ent.lights).toHaveLength(0);
    expect(ent.switches).toHaveLength(1);
    expect(ent.switches[0].address).toBe("1/1/2");
    expect(ent.switches[0].state_address).toBe("1/5/2");
  });

  it("normalizes DPT like 9.1 to 9.001 when mapping sensors", () => {
    const gaTemp = makeGa("ga7", "4/0/1", "9.1", "Outdoor Temp");

    const catalog = makeCatalog({
      gas: [gaTemp],
      devices: [
        {
          id: "dev1",
          channels: [
            {
              id: "ch3",
              name: "Weather",
              comObjects: [
                {
                  id: "co4",
                  name: "Temperature State",
                  dpt: "9.001",
                  flags: { read: true },
                  bindings: [
                    { role: "state", gaId: gaTemp.id },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const ent = buildHaEntities(catalog);
    expect(ent.sensors).toHaveLength(1);
    expect(ent.sensors[0].state_address).toBe("4/0/1");
    expect(ent.sensors[0].type).toBe("temperature");
  });
});
