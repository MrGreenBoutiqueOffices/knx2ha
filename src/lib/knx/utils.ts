export type UnknownRecord = Record<string, unknown>;

export function isObject(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function toStringIfScalar(v: unknown): string | undefined {
  if (isString(v)) return v;
  if (isNumber(v)) return String(v);
  return undefined;
}

export function ensureArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v === undefined || v === null) return [];
  return [v as T];
}

export function extractText(
  obj: unknown,
  keys: readonly string[]
): string | undefined {
  if (!isObject(obj)) return undefined;
  for (const k of keys) {
    const val = obj[k];
    const s = toStringIfScalar(val);
    if (s !== undefined) return s;
  }
  return undefined;
}

export function keyEndsWith(key: string, suffix: string): boolean {
  return new RegExp(`(^|:|_)${suffix}$`).test(key);
}

export function parseAddress(
  addr: string
): { main: number; middle: number; sub: number } | null {
  const m = addr.trim().match(/^(\d+)\/(\d+)\/(\d+)$/);
  if (!m) return null;
  return { main: Number(m[1]), middle: Number(m[2]), sub: Number(m[3]) };
}

export function decodeGaIntToTriple(n: number): string {
  const main = Math.floor(n / 2048);
  const middle = Math.floor((n % 2048) / 256);
  const sub = n % 256;
  return `${main}/${middle}/${sub}`;
}

type NormalizedDptParts = { main: number; sub?: number };

const DPT_PARTS_CACHE = new Map<string, NormalizedDptParts | null>();
const DPT_DOT_CACHE = new Map<string, string | undefined>();
const DPT_HYPHEN_CACHE = new Map<string, string | null>();

function computeNormalizedDptParts(dpt?: string): NormalizedDptParts | null {
  if (!dpt) return null;
  const cached = DPT_PARTS_CACHE.get(dpt);
  if (cached !== undefined) return cached;

  let s = dpt.trim().toLowerCase();
  if (!s) {
    DPT_PARTS_CACHE.set(dpt, null);
    return null;
  }

  s = s.replace(/^dpst?-/, "");
  s = s.replace(/_/g, "-");
  s = s.replace(/\s+/g, "");
  s = s.replace(/\./g, "-");

  const match = s.match(/^(\d+)(?:-(\d+))?$/);
  if (!match) {
    DPT_PARTS_CACHE.set(dpt, null);
    return null;
  }

  const main = Number.parseInt(match[1], 10);
  const sub = match[2] !== undefined ? Number.parseInt(match[2], 10) : undefined;

  if (!Number.isFinite(main) || (sub !== undefined && !Number.isFinite(sub))) {
    DPT_PARTS_CACHE.set(dpt, null);
    return null;
  }

  const parts: NormalizedDptParts = {
    main,
    sub,
  };
  DPT_PARTS_CACHE.set(dpt, parts);
  return parts;
}

export function normalizeDptToDot(dpt?: string): string | undefined {
  if (!dpt) return undefined;
  if (DPT_DOT_CACHE.has(dpt)) return DPT_DOT_CACHE.get(dpt);

  const parts = computeNormalizedDptParts(dpt);
  const value = parts
    ? parts.sub === undefined || parts.sub === 0
      ? String(parts.main)
      : `${parts.main}.${String(parts.sub).padStart(3, "0")}`
    : undefined;

  DPT_DOT_CACHE.set(dpt, value);
  return value;
}

export function normalizeDptToHyphen(dpt?: string): string | null {
  if (!dpt) return null;
  if (DPT_HYPHEN_CACHE.has(dpt)) return DPT_HYPHEN_CACHE.get(dpt) ?? null;

  const parts = computeNormalizedDptParts(dpt);
  const value = parts
    ? parts.sub === undefined
      ? String(parts.main)
      : `${parts.main}-${parts.sub}`
    : null;

  DPT_HYPHEN_CACHE.set(dpt, value);
  return value;
}
