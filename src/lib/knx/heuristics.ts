import type { HAType } from "./types";

function isStatusName(name: string): boolean {
  return /\bstatus\b/i.test(name);
}

function isDoorLike(name: string): boolean {
  return /(deur|schuifdeur|door)/i.test(name);
}

export function isLA(name: string): boolean {
  return /^LA\d+/i.test(name) || /^LA\d+-/i.test(name);
}

function normalizeDpt(dpt?: string): string | null {
  if (!dpt) return null;
  let s = dpt.trim().toLowerCase();
  s = s.replace(/^dpst?-/, "");
  s = s.replace(/\./, "-");
  const m = s.match(/^(\d+)-0*(\d+)$/);
  if (m) return `${parseInt(m[1], 10)}-${parseInt(m[2], 10)}`;
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  if (/^\d+-\d+$/.test(s)) return s;
  return null;
}

export function guessEntityType(dpt: string | undefined, name: string): HAType {
  const nd = normalizeDpt(dpt);

  if (nd) {
    if (nd === "1-1") return isStatusName(name) ? "binary_sensor" : "switch";
    if (nd === "3-7") return "light"; // dimming step
    if (nd === "5-1") return "light"; // brightness
    if (nd.startsWith("7-")) return "sensor"; // 2byte_unsigned (bv. brightness, current, length_mm)
    if (nd.startsWith("8-")) return "sensor"; // 2byte_signed (delta_time, percentV16, etc.)
    if (nd.startsWith("9-") || nd === "9") return "sensor"; // 2byte_float
    if (nd === "10-1") return "sensor"; // time (as sensor)
    if (nd === "11-1") return "sensor"; // date (as sensor)
    if (nd === "12-1" || nd.startsWith("12-")) return "sensor"; // 4byte_unsigned
    if (nd === "1-10") return isDoorLike(name) ? "cover" : "switch";
    if (nd === "1-2") return "switch";
    if (nd === "2-1") return "switch";
    if (nd === "20-102") return "sensor"; // HVAC mode
  }

  const n = name.toLowerCase();
  if (isLA(name) || /(licht|light|lamp|dim)/.test(n)) return "light";
  if (
    /(temp|temperatuur|temperature|hum|co2|lux|druk|pressure|wind|rain|flow)/.test(
      n
    )
  )
    return "sensor";
  if (/(rolluik|jaloezie|blind|shutter|cover)/.test(n)) return "cover";
  if (isStatusName(name)) return "binary_sensor";
  if (/(aan|uit|switch|centraal)/.test(n)) return "switch";
  return "unknown";
}
