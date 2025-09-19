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

    expect(catalog.project_name).toBe("Demo Project");
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

    expect(catalog.project_name).toBe("MyHouse");
    expect(catalog.group_addresses[0]?.name).toBe("Fallback");
  });

  it("handles archives with no group address entries", async () => {
    const zipData = makeZip({ "empty.knxproj": "" });
    const file = new MemoryFile("empty.zip", zipData);
    const onProgress = jest.fn();
    const catalog = await parseKnxproj(file, { onProgress });

    expect(catalog.project_name).toBe("empty");
    expect(catalog.group_addresses).toHaveLength(0);

    const phases = onProgress.mock.calls.map(([payload]) => payload.phase);
    expect(phases).toContain("load_zip");
    expect(phases).toContain("done");
  });
});
