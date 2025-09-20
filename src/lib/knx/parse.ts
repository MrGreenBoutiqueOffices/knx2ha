import { unzip } from "fflate";
import { XMLParser } from "fast-xml-parser";
import type { GroupAddress, KnxCatalog, KnxLinkInfo } from "../types";
import { ParseProgress } from "../types/parse";
import { decodeGaIntToTriple } from "./utils";

function post(
  onProgress: ((p: ParseProgress) => void) | undefined,
  p: ParseProgress
) {
  if (onProgress) onProgress(p);
}

// Progress slices ensure the bar ramps smoothly through each parser phase so
// users see steady movement: zip scanning (0–20%), per-file work (20–80%),
// catalog build (80–95%), and finalization (95–100%).
const SCAN_RANGE: [number, number] = [0, 20];
const FILE_RANGE: [number, number] = [20, 80];
const BUILD_RANGE: [number, number] = [80, 95];
const FINAL_RANGE: [number, number] = [95, 100];
// Target number of incremental updates while assembling the catalog so large
// projects feel responsive without overwhelming the UI.
const BUILD_PROGRESS_TARGET_UPDATES = 80;

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function rangePercent(range: [number, number], t: number): number {
  const [start, end] = range;
  return start + (end - start) * clamp01(t);
}

// fast-xml-parser setup (tuned for speed: avoid value parsing and extra structures)
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  ignoreDeclaration: true,
  ignorePiTags: true,
});

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

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractAttributes(node: unknown): Record<string, string> | null {
  if (!isObject(node)) return null;
  const out: Record<string, string> = {};
  let found = false;
  for (const [k, v] of Object.entries(node)) {
    if (!k.startsWith("@_")) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k.slice(2)] = String(v);
      found = true;
    }
  }
  return found ? out : null;
}

function tagEndsWith(tag: string, suffix: string): boolean {
  const last = tag.split(":").pop() || tag;
  return last.toLowerCase() === suffix.toLowerCase();
}

function scanXmlAst(
  filename: string,
  root: unknown
): { gas: GroupAddress[]; projectName: string | null; links: KnxLinkInfo[] } {
  const gas: GroupAddress[] = [];
  const links: KnxLinkInfo[] = [];
  let projectName: string | null = null;

  type StackItem = { tag: string; attrs: Record<string, string> };
  const getContextFromStack = (stack: StackItem[]): string | undefined => {
    const names: string[] = [];
    for (let i = stack.length - 1; i >= 0; i--) {
      const { attrs } = stack[i];
      const nm = attrs["Name"] || attrs["Text"] || undefined;
      if (nm) names.push(nm);
      if (names.length >= 3) break;
    }
    if (names.length === 0) return undefined;
    return names.reverse().join(" / ");
  };

  const extractFlags = (attrs: Record<string, string>): Record<string, boolean | string> | undefined => {
    const out: Record<string, boolean | string> = {};
    let any = false;
    for (const [k, v] of Object.entries(attrs)) {
      if (/flag$/i.test(k)) {
        const tv = typeof v === "string" ? v.toLowerCase() : String(v);
        if (tv === "true" || tv === "false") out[k] = tv === "true";
        else out[k] = v;
        any = true;
      }
    }
    return any ? out : undefined;
  };

  const stack: StackItem[] = [];

  const visit = (node: unknown) => {
    if (!isObject(node)) return;
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("@_") || key === "#text") continue;

      const processEntry = (entry: unknown) => {
        const attrs = extractAttributes(entry) ?? {};
        const here: StackItem = { tag: key, attrs };
        stack.push(here);

        // Project name discovery
        if (projectName == null) {
          if (tagEndsWith(key, "Project")) {
            const n = attrs["Name"];
            if (n && n.trim()) projectName = n.trim();
          } else if (tagEndsWith(key, "ProjectInformation")) {
            const n = attrs["ProjectName"] || attrs["Name"];
            if (n && n.trim()) projectName = n.trim();
          }
        }

        // GroupAddress collection (leaf)
        if (tagEndsWith(key, "GroupAddress")) {
          const address = normalizeAddressFromAttrs(attrs);
          if (address) {
            const id = attrs["Id"] || attrs["ID"] || `${filename}#${gas.length}`;
            const name = attrs["Name"] || attrs["Text"] || attrs["Description"] || "Unknown";
            const dpt = attrs["DPTs"] || attrs["DatapointType"] || attrs["Datapoint"] || undefined;
            const description = attrs["Description"] || undefined;
            gas.push({ id, name, address, dpt, description });
          }
          stack.pop();
          return; // Do not descend into GA children
        }

        // Links based on GroupAddressRef (leaf)
        if (tagEndsWith(key, "GroupAddressRef")) {
          const gaId = attrs["RefId"] || attrs["GroupAddressRefId"] || attrs["GroupAddressId"] || attrs["Id"];
          if (gaId) {
            const ctx = getContextFromStack(stack);
            let comObject: string | undefined;
            let dpt: string | undefined;
            let flags: Record<string, boolean | string> | undefined;
            for (let i = stack.length - 1; i >= 0; i--) {
              const it = stack[i];
              if (/(comobject|comobjectinstance|comobjectinstanceref)$/i.test(it.tag)) {
                comObject = it.attrs["Name"] || it.attrs["Text"] || comObject;
                dpt = dpt || it.attrs["DPTs"] || it.attrs["DatapointType"] || it.attrs["Datapoint"];
                flags = flags || extractFlags(it.attrs);
                break;
              }
            }
            links.push({ gaId, context: ctx, comObject, dpt, flags });
          }
          stack.pop();
          return; // Do not descend into ref children
        }

        if (isObject(entry)) visit(entry);
        stack.pop();
      };

      if (Array.isArray(value)) value.forEach(processEntry);
      else processEntry(value);
    }
  };

  visit(root);
  return { gas, projectName, links };
}

export async function parseKnxproj(
  file: File,
  opts?: {
    debug?: boolean;
    onProgress?: (p: ParseProgress) => void;
    // performance tuning
    preScanBytes?: number; // how many bytes to decode for quick tag pre-scan (default 8192)
    yieldEveryFiles?: number; // cooperative yield interval (default 8)
    yieldDelayMs?: number; // delay for cooperative yield (default 0)
  }
): Promise<KnxCatalog> {
  const onProgress = opts?.onProgress;
  const preScanBytes = Math.max(512, Math.min(1 << 20, opts?.preScanBytes ?? 8192));
  const yieldEveryFiles = Math.max(1, Math.min(128, opts?.yieldEveryFiles ?? 8));
  const yieldDelayMs = Math.max(0, Math.min(10, opts?.yieldDelayMs ?? 0));
  let foundGAs = 0;
  let processedGAs = 0;
  let totalFiles = 0;
  let processedFiles = 0;

  const emit = (
    phase: ParseProgress["phase"],
    percent: number,
    extra: Partial<ParseProgress> = {}
  ) => {
    post(onProgress, {
      phase,
      percent,
      totalFiles,
      processedFiles,
      foundGAs,
      processedGAs,
      ...extra,
    });
  };

  emit("load_zip", rangePercent(SCAN_RANGE, 0));

  const buffer = await file.arrayBuffer();

  emit("scan_entries", rangePercent(SCAN_RANGE, 0.05));

  const entries: Record<string, Uint8Array> = await new Promise(
    (resolve, reject) => {
      unzip(
        new Uint8Array(buffer),
        {
          // Only decompress XML files to reduce I/O and memory
          filter: (f) => /\.xml$/i.test(f.name),
        },
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
  totalFiles = xmlNames.length;
  processedFiles = 0;
  const decoder = new TextDecoder("utf-8");

  emit("scan_entries", rangePercent(SCAN_RANGE, 1));

  const gathered: GroupAddress[] = [];
  let projectName: string | undefined;
  const allLinks: KnxLinkInfo[] = [];

  const perFileDenom = Math.max(1, totalFiles);
  const perFilePercent = (fileIndex: number, intra: number) =>
    rangePercent(FILE_RANGE, (fileIndex + clamp01(intra)) / perFileDenom);
  // (removed prevGatheredCount; we now track foundGAs directly)

  for (let i = 0; i < xmlNames.length; i++) {
    const name = xmlNames[i];
    emit("extract_xml", perFilePercent(i, 0), {
      filename: name,
      filePercent: 0,
    });

    const raw = entries[name];
    // Partial decode for fast tag pre-scan
    const head = raw.subarray(0, Math.min(preScanBytes, raw.length));
    const headText = decoder.decode(head);
    const hasRelevant =
      headText.indexOf("GroupAddress") !== -1 ||
      headText.indexOf("GroupAddressRef") !== -1 ||
      headText.indexOf("Project") !== -1 ||
      headText.indexOf("ProjectInformation") !== -1;

    if (!hasRelevant) {
      // Skip full decode and parsing
      delete entries[name as keyof typeof entries];
      processedFiles++;
      emit("parse_xml", perFilePercent(i, 1), {
        filename: name,
        filePercent: 100,
      });
      if ((i % yieldEveryFiles) === yieldEveryFiles - 1) {
        await new Promise((r) => setTimeout(r, yieldDelayMs));
      }
      continue;
    }

    let xml = decoder.decode(raw);
    // Free the raw entry to reduce peak memory
    delete entries[name as keyof typeof entries];

    // Cheap pre-scan: skip parsing files without relevant tags
    // This avoids heavy XML parsing for unrelated files.
    if (
      xml.indexOf("GroupAddress") === -1 &&
      xml.indexOf("GroupAddressRef") === -1 &&
      xml.indexOf("Project") === -1 &&
      xml.indexOf("ProjectInformation") === -1
    ) {
      processedFiles++;
      emit("parse_xml", perFilePercent(i, 1), {
        filename: name,
        filePercent: 100,
      });
      continue;
    }
    try {
      const ast = parser.parse(xml);
      const { gas, projectName: pn, links } = scanXmlAst(name, ast);
      gathered.push(...gas);
      foundGAs += gas.length;
      if (links && links.length) allLinks.push(...links);
      if (projectName === undefined && pn) projectName = pn;
    } catch {
      // Fallback minimal regex extraction in case XML parser fails on a single file
      const gasOnly = (() => {
        const RE_GROUP_TAG = /<(?::?\w+:)?GroupAddress\b([^>]*)>/gi;
        const RE_ATTR = /\b([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/g;
        const gas: GroupAddress[] = [];
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
          const id = attrs["Id"] || attrs["ID"] || `${name}#${gas.length}`;
          const nm = attrs["Name"] || attrs["Text"] || attrs["Description"] || "Unknown";
          const dpt = attrs["DPTs"] || attrs["DatapointType"] || attrs["Datapoint"] || undefined;
          const description = attrs["Description"] || undefined;
          gas.push({ id, name: nm, address, dpt, description });
        }
        return gas;
      })();
      gathered.push(...gasOnly);
      foundGAs += gasOnly.length;
    }

  processedFiles++;
  // no-op; foundGAs already updated
    emit("parse_xml", perFilePercent(i, 1), {
      filename: name,
      filePercent: 100,
    });

    // Cooperative yield every 8 files to keep UI/worker responsive
    if ((i % yieldEveryFiles) === yieldEveryFiles - 1) {
      await new Promise((r) => setTimeout(r, yieldDelayMs));
    }

    // Help GC drop the large XML string ASAP
    xml = "";
  }

  if (!projectName) {
    // Fall back to uploaded filename (without extension) when XML didn't contain project info
    const original = file.name || "Unknown";
    projectName = original.replace(/\.(knxproj|zip)$/i, "").trim() || "Unknown";
  }

  const map = new Map<string, GroupAddress>();
  const totalFound = gathered.length;
  let processedEntries = 0;
  const buildProgressBatch =
    totalFound > 0
      ? Math.max(1, Math.floor(totalFound / BUILD_PROGRESS_TARGET_UPDATES))
      : 1;

  const emitBuildProgress = () => {
    const ratio = totalFound === 0 ? 1 : processedEntries / totalFound;
    emit("build_catalog", rangePercent(BUILD_RANGE, ratio));
  };

  emitBuildProgress();

  if (totalFound > 0) {
    for (const ga of gathered) {
      processedEntries++;
      const existed = map.has(ga.id);
      map.set(ga.id, ga);
      if (!existed) processedGAs++;

      if (
        processedEntries === totalFound ||
        processedEntries % buildProgressBatch === 0
      ) {
        emitBuildProgress();
      }
    }
  }

  const list = Array.from(map.values()).sort((a, b) =>
    compareAddress(a.address, b.address)
  );

  emit("done", rangePercent(FINAL_RANGE, 1));

  const idSet = new Set(list.map((g) => g.id));
  const links = allLinks.filter((l) => idSet.has(l.gaId));

  return { project_name: projectName ?? null, group_addresses: list, links };
}
