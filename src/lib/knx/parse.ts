import { unzip } from "fflate";
import type { GroupAddress, KnxCatalog } from "../types";
import { ParseProgress } from "../types/parse";

const RE_PROJECT = /<(?:\w+:)?Project\b[^>]*\bName="([^"]+)"/i;
const RE_PROJ_INFO_1 =
  /<(?:\w+:)?ProjectInformation\b[^>]*\bProjectName="([^"]+)"/i;
const RE_PROJ_INFO_2 = /<(?:\w+:)?ProjectInformation\b[^>]*\bName="([^"]+)"/i;
const RE_GROUP_TAG_G = /<(?::?\w+:)?GroupAddress\b([^>]*)>/g;
const RE_ATTR_G = /\b([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g;

function post(
  onProgress: ((p: ParseProgress) => void) | undefined,
  p: ParseProgress
) {
  if (onProgress) onProgress(p);
}

function decodeGaIntToTriple(n: number): string {
  const main = (n >> 11) & 0x1f; // 5 bits
  const middle = (n >> 8) & 0x07; // 3 bits
  const sub = n & 0xff; // 8 bits
  return `${main}/${middle}/${sub}`;
}

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

const ADDRESS_KEY_CACHE = new Map<string, [number, number, number]>();
function addressKey(a: string): [number, number, number] {
  let k = ADDRESS_KEY_CACHE.get(a);
  if (k) return k;
  const [m, mi, s] = a.split("/").map((x) => parseInt(x, 10) || 0) as [
    number,
    number,
    number
  ];
  ADDRESS_KEY_CACHE.set(a, (k = [m, mi, s]));
  return k;
}
function compareAddress(a: string, b: string): number {
  const A = addressKey(a);
  const B = addressKey(b);
  return A[0] - B[0] || A[1] - B[1] || A[2] - B[2];
}

/** ---------- Lazy/streaming XML-scan ---------- */
function scanGroupAddressesStream(
  filename: string,
  u8: Uint8Array,
  chunkSize = 128 * 1024,
  tailKeep = 2048
): { gas: GroupAddress[]; projectName: string | null } {
  const gas: GroupAddress[] = [];
  let projectName: string | null = null;

  const decoder = new TextDecoder("utf-8");
  let buf = "";

  const processBuffer = (final: boolean) => {
    if (!projectName) {
      let m = RE_PROJECT.exec(buf);
      if (m) projectName = m[1];
      if (!projectName) {
        m = RE_PROJ_INFO_1.exec(buf) || RE_PROJ_INFO_2.exec(buf);
        if (m) projectName = m[1];
      }
    }

    RE_GROUP_TAG_G.lastIndex = 0;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = RE_GROUP_TAG_G.exec(buf)) !== null) {
      const attrStr = tagMatch[1];

      const attrs: Record<string, string | undefined> = {};
      RE_ATTR_G.lastIndex = 0;
      let kv: RegExpExecArray | null;
      while ((kv = RE_ATTR_G.exec(attrStr)) !== null) {
        attrs[kv[1]] = kv[2];
      }

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

    if (!final) {
      buf = buf.slice(Math.max(0, buf.length - tailKeep));
    } else {
      buf = "";
    }
  };

  for (let off = 0; off < u8.length; off += chunkSize) {
    const end = Math.min(off + chunkSize, u8.length);
    const text = decoder.decode(u8.subarray(off, end), {
      stream: end < u8.length,
    });
    buf += text;
    processBuffer(false);
  }
  processBuffer(true);

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
  post(onProgress, { phase: "load_zip", percent: 2 });

  const buffer = await file.arrayBuffer();

  post(onProgress, { phase: "scan_entries", percent: 5 });

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
  post(onProgress, { phase: "scan_entries", percent: 8, totalFiles });

  const baseStart = 10;
  const baseEnd = 95;
  let processedFiles = 0;

  function updateOverall(fileIndex: number, filePercent: number) {
    const perFileSpan = (baseEnd - baseStart) / Math.max(1, totalFiles);
    const percent = baseStart + perFileSpan * (fileIndex + filePercent / 100);
    return Math.max(10, Math.min(95, percent));
  }

  const gathered: GroupAddress[] = [];
  let projectName: string | undefined;

  for (let i = 0; i < xmlNames.length; i++) {
    const name = xmlNames[i];

    post(onProgress, {
      phase: "extract_xml",
      percent: updateOverall(i, 0),
      filename: name,
      totalFiles,
      processedFiles,
      filePercent: 100,
    });

    const { gas, projectName: pn } = scanGroupAddressesStream(
      name,
      entries[name]
    );
    gathered.push(...gas);
    if (projectName === undefined && pn) projectName = pn;

    processedFiles++;
    post(onProgress, {
      phase: "parse_xml",
      percent: updateOverall(i, 100),
      filename: name,
      totalFiles,
      processedFiles,
      filePercent: 100,
    });
  }

  if (!projectName) {
    const knxEntry = Object.keys(entries).find((n) =>
      n.toLowerCase().endsWith(".knxproj")
    );
    const topName = knxEntry ? knxEntry.split("/").pop() : undefined;
    projectName = topName?.replace(/\.knxproj$/i, "") || "Unknown";
  }

  post(onProgress, {
    phase: "build_catalog",
    percent: 96,
    totalFiles,
    processedFiles,
  });

  ADDRESS_KEY_CACHE.clear();
  const map = new Map<string, GroupAddress>();
  for (const ga of gathered) map.set(`${ga.address}@@${ga.name}`, ga);

  const list = Array.from(map.values()).sort((a, b) =>
    compareAddress(a.address, b.address)
  );

  post(onProgress, { phase: "done", percent: 100, totalFiles, processedFiles });

  return { project_name: projectName ?? null, group_addresses: list };
}
