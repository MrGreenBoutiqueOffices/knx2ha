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
