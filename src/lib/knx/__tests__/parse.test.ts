import { describe, expect, it } from "@jest/globals";
import { zipSync } from "fflate";

import { parseKnxproj } from "@/lib/knx/parse";

class MemoryFile implements File {
  readonly lastModified: number;
  readonly type: string;
  readonly webkitRelativePath = "";
  #buffer: ArrayBuffer;

  constructor(readonly name: string, data: Uint8Array, type = "application/zip") {
    const copy = new Uint8Array(data.byteLength);
    copy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    this.#buffer = copy.buffer;
    this.lastModified = Date.now();
    this.type = type;
  }

  get size(): number {
    return this.#buffer.byteLength;
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(this.#buffer.slice(0));
  }

  bytes(): Promise<Uint8Array<ArrayBuffer>> {
    return this.arrayBuffer().then(
      (buf) => new Uint8Array(buf) as Uint8Array<ArrayBuffer>
    );
  }

  stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
    return new ReadableStream<Uint8Array<ArrayBuffer>>({
      start: (controller) => {
        controller.enqueue(
          new Uint8Array(this.#buffer) as Uint8Array<ArrayBuffer>
        );
        controller.close();
      },
    });
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    const blob = new Blob([this.#buffer], { type: this.type });
    return blob.slice(start, end, contentType);
  }

  text(): Promise<string> {
    return this.bytes().then((buf) => new TextDecoder().decode(buf));
  }
}

const te = new TextEncoder();

function makeZip(entries: Record<string, string | Uint8Array>): Uint8Array {
  const payload: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(entries)) {
    payload[name] = typeof content === "string" ? te.encode(content) : content;
  }
  return zipSync(payload, { level: 0 });
}

describe("parseKnxproj", () => {
  it("parses group addresses and project name from XML entries", async () => {
    const xml = `<?xml version="1.0"?>
<Project Name="Demo Project">
  <GroupAddress Id="ga-1" Name="Living Room Light" Address="1/0/5" DatapointType="1.001" Description="Light" />
  <GroupAddress Id="ga-2" Name="Bedroom Sensor" MainGroup="1" MiddleGroup="1" SubGroup="10" DPTs="9.001" />
  <GroupAddress Id="ga-dup" Name="Old Address" Address="3/0/1" />
  <GroupAddress Id="ga-dup" Name="Updated Address" Address="2/0/1" />
  <GroupAddress Id="ga-3" Name="Numeric Address" Address="2049" />
</Project>`;

    const zipData = makeZip({
      "project/groupaddresses.xml": xml,
      "project/demo.knxproj": "",
    });

    const file = new MemoryFile("fixture.knxproj.zip", zipData);
    const onProgress = jest.fn();
    const catalog = await parseKnxproj(file, { onProgress });

  expect(catalog.meta.name).toBe("Demo Project");
    expect(catalog.group_addresses).toHaveLength(4);

    const addresses = catalog.group_addresses.map((ga) => ga.address);
    expect(addresses).toEqual(["1/0/1", "1/0/5", "1/1/10", "2/0/1"]);

    const duplicate = catalog.group_addresses.find((ga) => ga.id === "ga-dup");
    expect(duplicate?.name).toBe("Updated Address");

    const phases = onProgress.mock.calls.map(([payload]) => payload.phase);
    expect(phases).toContain("build_catalog");
    expect(phases).toContain("done");
  });

  it("falls back to knxproj filename when XML lacks project name", async () => {
    const xml = `<?xml version="1.0"?>
<GroupAddress Id="ga-1" Name="Fallback" Address="1/0/1" />`;

    const zipData = makeZip({
      "ga.xml": xml,
      "MyHouse.knxproj": "",
    });

    const file = new MemoryFile("fallback.knxproj.zip", zipData);
    const catalog = await parseKnxproj(file);

  expect(catalog.meta.name).toBe("MyHouse");
    expect(catalog.group_addresses[0]?.name).toBe("Fallback");
  });

  it("handles archives with no group address entries", async () => {
    const zipData = makeZip({ "empty.knxproj": "" });
    const file = new MemoryFile("empty.zip", zipData);
    const onProgress = jest.fn();
    const catalog = await parseKnxproj(file, { onProgress });

  expect(catalog.meta.name).toBe("empty");
    expect(catalog.group_addresses).toHaveLength(0);

    const phases = onProgress.mock.calls.map(([payload]) => payload.phase);
    expect(phases).toContain("load_zip");
    expect(phases).toContain("done");
  });
});

describe("parseKnxproj rich structures", () => {
  it("assembles topology, links and enriches GA dpt from com objects; includes standalone GAs and secure flags", async () => {
    const xml = `<?xml version="1.0"?>
<Project Name="Complex">
  <Topology>
    <Area Id="area1" Name="Area" Address="1">
      <Line Id="line1" Name="Line" Address="1.1">
        <Segment Id="seg1" Name="Seg" Address="1.1.1" />
        <DeviceInstance Id="dev1" Name="Actuator" Address="1.1.10" ApplicationProgramRefId="app1">
          <ChannelInstance Id="ch1" Name="Channel 1" Number="1">
            <ComObjectInstanceRef Id="co1" Name="Switch" Number="1" DatapointType="1.001" RefId="coDef1">
              <GroupAddressRef RefId="ga1" />
            </ComObjectInstanceRef>
            <ComObjectInstanceRef Id="co2" Name="Brightness" Number="2" DatapointType="5.001" RefId="coDef2">
              <GroupAddressRef RefId="ga2" />
            </ComObjectInstanceRef>
            <ComObjectInstanceRef Id="co3" Name="Status" Number="3" DatapointType="1.001" RefId="coDef3">
              <GroupAddressRef RefId="ga1" />
            </ComObjectInstanceRef>
          </ChannelInstance>
        </DeviceInstance>
      </Line>
    </Area>
  </Topology>

  <GroupRange Id="grMain" Name="Main 1" Address="1">
    <GroupRange Id="grMid" Name="Middle 1" Address="1">
      <GroupRange Id="grSub" Name="Sub 1" Address="1">
        <GroupAddress Id="ga1" Name="LA Woonkamer" Address="1/1/1" DatapointType="1.001" />
      </GroupRange>
    </GroupRange>
  </GroupRange>

  <!-- Standalone GA without DPT, will be enriched from com object -->
  <GroupAddress Id="ga2" Name="LA Woonkamer Bright" Main="1" Middle="3" Sub="1" />
  <!-- Secure GA marker -->
  <GroupAddress Id="ga3" Name="Secure GA" Address="1/5/1" Security="Auth" />
</Project>`;

    const zipData = makeZip({ "project/complex.xml": xml, "Complex.knxproj": "" });
    const file = new MemoryFile("complex.knxproj.zip", zipData);
    const catalog = await parseKnxproj(file);

    // Meta
    expect(catalog.meta.name).toBe("Complex");

    // Topology assembled
    expect(catalog.topology.areas).toHaveLength(1);
    const area = catalog.topology.areas[0];
    expect(area.lines).toHaveLength(1);
    const line = area.lines[0];
    expect(line.devices).toHaveLength(1);

    // Group addresses: both range-based and standalone included
    const flat = catalog.groupAddresses.flat.map((g) => g.address);
    expect(flat.sort()).toEqual(["1/1/1", "1/3/1", "1/5/1"].sort());

    // Legacy compat list is populated and DPT is enriched from com object for ga2
    const byId = new Map(catalog.group_addresses.map((g) => [g.id, g] as const));
    expect(byId.get("ga1")?.dpt).toBe("1.001");
    expect(byId.get("ga2")?.dpt).toBe("5.001"); // came from com object

    // Links present for both ga1 (two bindings) and ga2
    const ga1Links = catalog.links?.filter((l) => l.gaId === "ga1") ?? [];
    expect(ga1Links.length).toBeGreaterThanOrEqual(1);
    const ga2Links = catalog.links?.filter((l) => l.gaId === "ga2") ?? [];
    expect(ga2Links.length).toBeGreaterThanOrEqual(1);

    // Indexes populated
    expect(catalog.indexes.groupAddressesById["ga1"].address).toBe("1/1/1");
    expect(catalog.indexes.comObjectsById["co2"].datapointType).toBe("5.001");

    // Stats and secure flags
    expect(catalog.stats.totals.groupAddresses).toBe(3);
    expect(catalog.stats.secure.hasSecure).toBe(true);
    expect(catalog.stats.secure.secureGroupAddressCount).toBe(1);
    expect(Object.keys(catalog.stats.dptUsage)).toEqual(
      expect.arrayContaining(["1.001", "5.001"])
    );
  });
});
