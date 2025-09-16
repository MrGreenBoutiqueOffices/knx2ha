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

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

function normalizeAddress(gaNode: unknown): string | undefined {
  if (!isObject(gaNode)) return undefined;

  // 1) Direct Address
  const addrRaw =
    gaNode["Address"] ?? gaNode["address"] ?? gaNode["Addr"] ?? gaNode["addr"];
  const addrStr = toStringIfScalar(addrRaw);
  if (addrStr) {
    const s = addrStr.trim();
    if (s.includes("/")) return s;
    if (/^\d+$/.test(s)) return decodeGaIntToTriple(parseInt(s, 10));
  }

  // 2) Split fields -> main/middle/sub
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

export async function parseKnxproj(
  file: File,
  opts?: { debug?: boolean }
): Promise<KnxCatalog> {
  const zip = await JSZip.loadAsync(file);
  const xmlNames = Object.keys(zip.files).filter((n) =>
    n.toLowerCase().endsWith(".xml")
  );

  if (opts?.debug) console.log("[knx] XML files:", xmlNames);

  let projectName: string | undefined;
  const gathered: GroupAddress[] = [];

  for (const name of xmlNames) {
    const text = await zip.files[name].async("string");
    let json: unknown;
    try {
      json = parser.parse(text);
    } catch {
      continue;
    }
    if (projectName === undefined) {
      const pName = findProjectName(json);
      if (pName) projectName = pName;
    }
    collectGroupAddresses(json, gathered);
  }

  // Fallback: gebruik bestandsnaam (zonder extensie)
  if (!projectName) {
    const entry = Object.keys(zip.files).find((n) =>
      n.toLowerCase().endsWith(".knxproj")
    );
    const topName = entry ? entry.split("/").pop() : undefined;
    projectName = topName?.replace(/\.knxproj$/i, "") || "Onbekend";
  }

  // Dedup op (address + name)
  const map = new Map<string, GroupAddress>();
  for (const ga of gathered) map.set(`${ga.address}@@${ga.name}`, ga);

  const list = Array.from(map.values()).sort((a, b) =>
    a.address.localeCompare(b.address, undefined, { numeric: true })
  );

  if (opts?.debug)
    console.log(`[knx] Found ${list.length} GAs. Project: ${projectName}`);

  return { project_name: projectName ?? null, group_addresses: list };
}
