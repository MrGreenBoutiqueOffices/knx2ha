import { unzip } from "fflate";
import type { GroupAddress, KnxCatalog } from "../types";
import { ParseProgress } from "../types/parse";
import { decodeGaIntToTriple } from "./utils";

function post(
  onProgress: ((p: ParseProgress) => void) | undefined,
  p: ParseProgress
) {
  if (onProgress) onProgress(p);
}

const SCAN_RANGE: [number, number] = [0, 20];
const FILE_RANGE: [number, number] = [20, 80];
const BUILD_RANGE: [number, number] = [80, 95];
const FINAL_RANGE: [number, number] = [95, 100];

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function rangePercent(range: [number, number], t: number): number {
  const [start, end] = range;
  return start + (end - start) * clamp01(t);
}

const RE_PROJECT = /<(?:\w+:)?Project\b[^>]*\bName="([^"]+)"/i;
const RE_PROJ_INFO_1 =
  /<(?:\w+:)?ProjectInformation\b[^>]*\bProjectName="([^"]+)"/i;
const RE_PROJ_INFO_2 = /<(?:\w+:)?ProjectInformation\b[^>]*\bName="([^"]+)"/i;
const RE_GROUP_TAG = /<(?::?\w+:)?GroupAddress\b([^>]*)>/gi;
const RE_ATTR = /\b([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g;

function normalizeAddressFromAttrs(
  attrs: Record<string, string | undefined>
): string | undefined {
  const raw = attrs["Address"];
  if (raw) {
    const s = raw.trim();
    if (s.includes("/")) return s;
    if (/^\d+$/.test(s)) return decodeGaIntToTriple(parseInt(s, 10));
  }
  const mainStr = attrs["MainGroup"] ?? attrs["Main"] ?? undefined;
  const midStr = attrs["MiddleGroup"] ?? attrs["Middle"] ?? undefined;
  const subStr = attrs["SubGroup"] ?? attrs["Sub"] ?? undefined;
  if (mainStr && midStr && subStr) {
    const m = parseInt(mainStr, 10),
      mi = parseInt(midStr, 10),
      su = parseInt(subStr, 10);
    if (Number.isFinite(m) && Number.isFinite(mi) && Number.isFinite(su))
      return `${m}/${mi}/${su}`;
  }
  return undefined;
}

function addressKey(a: string): [number, number, number] {
  const [m, mi, s] = a.split("/").map((x) => parseInt(x, 10));
  return [m || 0, mi || 0, s || 0];
}

function compareAddress(a: string, b: string): number {
  const A = addressKey(a);
  const B = addressKey(b);
  return A[0] - B[0] || A[1] - B[1] || A[2] - B[2];
}

function scanGroupAddresses(
  filename: string,
  xml: string
): { gas: GroupAddress[]; projectName: string | null } {
  const gas: GroupAddress[] = [];
  let projectName: string | null = null;

  let m = RE_PROJECT.exec(xml);
  if (m) projectName = m[1];
  if (!projectName) {
    m = RE_PROJ_INFO_1.exec(xml) || RE_PROJ_INFO_2.exec(xml);
    if (m) projectName = m[1];
  }

  let tagMatch: RegExpExecArray | null;
  RE_GROUP_TAG.lastIndex = 0;
  while ((tagMatch = RE_GROUP_TAG.exec(xml)) !== null) {
    const attrStr = tagMatch[1];
    const attrs: Record<string, string | undefined> = {};
    RE_ATTR.lastIndex = 0;
    let kv: RegExpExecArray | null;
    while ((kv = RE_ATTR.exec(attrStr)) !== null) attrs[kv[1]] = kv[2];

    const address = normalizeAddressFromAttrs(attrs);
    if (!address) continue;

    const id = attrs["Id"] || attrs["ID"] || `${filename}#${gas.length}`;
    const name =
      attrs["Name"] || attrs["Text"] || attrs["Description"] || "Unknown";
    const dpt =
      attrs["DPTs"] ||
      attrs["DatapointType"] ||
      attrs["Datapoint"] ||
      undefined;
    const description = attrs["Description"] || undefined;

    gas.push({ id, name, address, dpt, description });
  }

  return { gas, projectName };
}

export async function parseKnxproj(
  file: File,
  opts?: {
    debug?: boolean;
    onProgress?: (p: ParseProgress) => void;
  }
): Promise<KnxCatalog> {
  const onProgress = opts?.onProgress;
  let foundGAs = 0;
  let processedGAs = 0;

  post(onProgress, {
    phase: "load_zip",
    percent: rangePercent(SCAN_RANGE, 0),
    foundGAs,
    processedGAs,
  });

  const buffer = await file.arrayBuffer();

  post(onProgress, {
    phase: "scan_entries",
    percent: rangePercent(SCAN_RANGE, 0.05),
    foundGAs,
    processedGAs,
  });

  const entries: Record<string, Uint8Array> = await new Promise(
    (resolve, reject) => {
      unzip(
        new Uint8Array(buffer),
        { filter: () => true },
        (err: Error | null, out: unknown) => {
          if (err) return reject(err);
          resolve(out as Record<string, Uint8Array>);
        }
      );
    }
  );

  const xmlNames = Object.keys(entries).filter((n) =>
    n.toLowerCase().endsWith(".xml")
  );
  const totalFiles = xmlNames.length;
  let processedFiles = 0;
  const decoder = new TextDecoder("utf-8");

  post(onProgress, {
    phase: "scan_entries",
    percent: rangePercent(SCAN_RANGE, 1),
    totalFiles,
    processedFiles,
    foundGAs,
    processedGAs,
  });

  const gathered: GroupAddress[] = [];
  let projectName: string | undefined;

  const perFileDenom = Math.max(1, totalFiles);
  const perFilePercent = (fileIndex: number, intra: number) =>
    rangePercent(FILE_RANGE, (fileIndex + clamp01(intra)) / perFileDenom);

  for (let i = 0; i < xmlNames.length; i++) {
    const name = xmlNames[i];
    post(onProgress, {
      phase: "extract_xml",
      percent: perFilePercent(i, 0),
      filename: name,
      totalFiles,
      processedFiles,
      filePercent: 0,
      foundGAs,
      processedGAs,
    });

    const xml = decoder.decode(entries[name]);
    const { gas, projectName: pn } = scanGroupAddresses(name, xml);
    gathered.push(...gas);
    if (projectName === undefined && pn) projectName = pn;

    processedFiles++;
    foundGAs += gas.length;
    post(onProgress, {
      phase: "parse_xml",
      percent: perFilePercent(i, 1),
      filename: name,
      totalFiles,
      processedFiles,
      filePercent: 100,
      foundGAs,
      processedGAs,
    });
  }

  if (!projectName) {
    const knxEntry = Object.keys(entries).find((n) =>
      n.toLowerCase().endsWith(".knxproj")
    );
    const topName = knxEntry ? knxEntry.split("/").pop() : undefined;
    projectName = topName?.replace(/\.knxproj$/i, "") || "Unknown";
  }

  const map = new Map<string, GroupAddress>();
  const totalFound = gathered.length;

  const emitBuildProgress = () => {
    const ratio = totalFound === 0 ? 1 : processedGAs / totalFound;
    post(onProgress, {
      phase: "build_catalog",
      percent: rangePercent(BUILD_RANGE, ratio),
      totalFiles,
      processedFiles,
      foundGAs,
      processedGAs,
    });
  };

  emitBuildProgress();

  if (totalFound > 0) {
    for (const ga of gathered) {
      map.set(ga.id, ga);
      processedGAs++;

      if (processedGAs === totalFound || processedGAs % 200 === 0) {
        emitBuildProgress();
      }
    }
  } else {
    processedGAs = 0;
  }

  const list = Array.from(map.values()).sort((a, b) =>
    compareAddress(a.address, b.address)
  );

  post(onProgress, {
    phase: "done",
    percent: rangePercent(FINAL_RANGE, 1),
    totalFiles,
    processedFiles,
    foundGAs,
    processedGAs,
  });

  return { project_name: projectName ?? null, group_addresses: list };
}
