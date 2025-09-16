"use client";

import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { GroupAddress, KnxCatalog } from "./types";
import {
  UnknownRecord,
  isObject,
  toStringIfScalar,
  ensureArray,
  extractText,
  keyEndsWith,
  decodeGaIntToTriple,
} from "./utils";

export type ParsePhase =
  | "load_zip"
  | "scan_entries"
  | "extract_xml"
  | "parse_xml"
  | "build_catalog"
  | "done";

export interface ParseProgress {
  phase: ParsePhase;
  percent: number;
  totalFiles?: number;
  processedFiles?: number;
  filename?: string;
  filePercent?: number;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

function normalizeAddress(gaNode: unknown): string | undefined {
  if (!isObject(gaNode)) return undefined;

  const addrRaw =
    gaNode["Address"] ?? gaNode["address"] ?? gaNode["Addr"] ?? gaNode["addr"];
  const addrStr = toStringIfScalar(addrRaw);
  if (addrStr) {
    const s = addrStr.trim();
    if (s.includes("/")) return s;
    if (/^\d+$/.test(s)) return decodeGaIntToTriple(parseInt(s, 10));
  }

  const main = toStringIfScalar(
    gaNode["MainGroup"] ??
      gaNode["mainGroup"] ??
      gaNode["Main"] ??
      gaNode["main"] ??
      gaNode["Main Address"] ??
      gaNode["MainAddress"]
  );
  const middle = toStringIfScalar(
    gaNode["MiddleGroup"] ??
      gaNode["middleGroup"] ??
      gaNode["Middle"] ??
      gaNode["middle"] ??
      gaNode["Middle Address"] ??
      gaNode["MiddleAddress"]
  );
  const sub = toStringIfScalar(
    gaNode["SubGroup"] ??
      gaNode["subGroup"] ??
      gaNode["Sub"] ??
      gaNode["sub"] ??
      gaNode["Sub Address"] ??
      gaNode["SubAddress"]
  );
  if (main && middle && sub) return `${main}/${middle}/${sub}`;
  return undefined;
}

function isKeyGroupAddresses(key: string) {
  return keyEndsWith(key, "GroupAddresses");
}
function isKeyGroupAddress(key: string) {
  return keyEndsWith(key, "GroupAddress");
}
function isKeyProject(key: string) {
  return keyEndsWith(key, "Project");
}
function isKeyProjectHeader(key: string) {
  return keyEndsWith(key, "ProjectHeader") || keyEndsWith(key, "Header");
}
function isKeyProjectInfo(key: string) {
  return (
    keyEndsWith(key, "ProjectInformation") || keyEndsWith(key, "ProjectInfo")
  );
}

function findProjectName(json: unknown): string | undefined {
  if (!isObject(json)) return undefined;

  for (const key of Object.keys(json)) {
    const node = json[key];

    if (
      (isKeyProject(key) || isKeyProjectHeader(key) || isKeyProjectInfo(key)) &&
      isObject(node)
    ) {
      const name =
        extractText(node, [
          "Name",
          "ProjectName",
          "Title",
          "ProjectTitle",
          "Project",
          "name",
        ]) ?? undefined;
      if (name) return name;
    }

    if (isObject(node)) {
      const deep = findProjectName(node);
      if (deep) return deep;
    }
  }
  return undefined;
}

function pushIfValid(ga: unknown, out: GroupAddress[]): void {
  if (!isObject(ga)) return;

  const idFromKeys =
    extractText(ga, ["Id", "id", "RefId", "refId", "Identifier"]) ?? undefined;
  const nameFromKeys =
    extractText(ga, [
      "Name",
      "name",
      "Text",
      "text",
      "Description",
      "description",
    ]) ??
    idFromKeys ??
    "Unnamed";
  const address = normalizeAddress(ga);

  const dpt =
    extractText(ga, ["DatapointType", "DPT", "DPTs", "Type", "type"]) ??
    extractText(
      isObject(ga["Parameters"])
        ? (ga["Parameters"] as UnknownRecord)
        : undefined,
      ["DatapointType", "DPT", "DPTs"]
    ) ??
    undefined;

  if (address) {
    const description =
      extractText(ga, ["Description", "description"]) ?? undefined;
    out.push({
      id: idFromKeys ?? `${nameFromKeys}:${address}`,
      name: nameFromKeys,
      address,
      description,
      dpt,
    });
  }
}

function collectGroupAddresses(json: unknown, out: GroupAddress[]): void {
  if (!isObject(json)) return;

  for (const key of Object.keys(json)) {
    const node = json[key];

    if (isKeyGroupAddresses(key) && isObject(node)) {
      for (const childKey of Object.keys(node)) {
        if (isKeyGroupAddress(childKey)) {
          const list = ensureArray<unknown>(node[childKey]);
          for (const ga of list) pushIfValid(ga, out);
        }
      }
    }
    if (isKeyGroupAddress(key)) {
      const list = ensureArray<unknown>(node);
      for (const ga of list) pushIfValid(ga, out);
    }
    if (isObject(node)) collectGroupAddresses(node, out);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const current = next++;
      if (current >= items.length) break;
      results[current] = await fn(items[current], current);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker()
  );
  await Promise.all(runners);
  return results;
}

export async function parseKnxproj(
  file: File,
  opts?: {
    debug?: boolean;
    onProgress?: (p: ParseProgress) => void;
    concurrency?: number;
  }
): Promise<KnxCatalog> {
  const onProgress = opts?.onProgress ?? (() => {});
  const concurrency = Math.max(1, Math.min(8, opts?.concurrency ?? 4));

  onProgress({ phase: "load_zip", percent: 2 });

  const zip = await JSZip.loadAsync(file);
  onProgress({ phase: "scan_entries", percent: 5 });

  const xmlNames = Object.keys(zip.files).filter((n) =>
    n.toLowerCase().endsWith(".xml")
  );
  const totalFiles = xmlNames.length;
  onProgress({ phase: "scan_entries", percent: 8, totalFiles });

  let projectName: string | undefined;
  const gathered: GroupAddress[] = [];

  const baseStart = 10;
  const baseEnd = 95;
  let processedFiles = 0;

  function updateOverall(fileIndex: number, filePercent: number) {
    const perFileSpan = (baseEnd - baseStart) / Math.max(1, totalFiles);
    const percent = baseStart + perFileSpan * (fileIndex + filePercent / 100);
    return Math.max(10, Math.min(95, percent));
  }

  await mapWithConcurrency(xmlNames, concurrency, async (name, idx) => {
    const text = await zip.files[name].async("string", (meta) => {
      const p = updateOverall(idx, meta.percent ?? 0);
      onProgress({
        phase: "extract_xml",
        percent: p,
        filename: name,
        totalFiles,
        processedFiles,
        filePercent: meta.percent ?? 0,
      });
    });

    onProgress({
      phase: "parse_xml",
      percent: updateOverall(idx, 100),
      filename: name,
      totalFiles,
      processedFiles,
      filePercent: 100,
    });

    let json: unknown;
    try {
      json = parser.parse(text);
    } catch {
      processedFiles++;
      return;
    }

    if (projectName === undefined) {
      const pName = findProjectName(json);
      if (pName) projectName = pName;
    }

    collectGroupAddresses(json, gathered);
    processedFiles++;

    onProgress({
      phase: "parse_xml",
      percent: updateOverall(idx, 100),
      filename: name,
      totalFiles,
      processedFiles,
      filePercent: 100,
    });
  });

  if (!projectName) {
    const entry = Object.keys(zip.files).find((n) =>
      n.toLowerCase().endsWith(".knxproj")
    );
    const topName = entry ? entry.split("/").pop() : undefined;
    projectName = topName?.replace(/\.knxproj$/i, "") || "Onbekend";
  }

  onProgress({
    phase: "build_catalog",
    percent: 96,
    totalFiles,
    processedFiles,
  });

  const map = new Map<string, GroupAddress>();
  for (const ga of gathered) map.set(`${ga.address}@@${ga.name}`, ga);

  const list = Array.from(map.values()).sort((a, b) =>
    a.address.localeCompare(b.address, undefined, { numeric: true })
  );

  onProgress({ phase: "done", percent: 100, totalFiles, processedFiles });

  return { project_name: projectName ?? null, group_addresses: list };
}
