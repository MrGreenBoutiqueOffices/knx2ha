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
    if (nd === "3-7") return "light"; // dimming step (increase/decrease)
    if (nd === "5-1") return "light"; // 0..100% (brightness / position)
    if (nd.startsWith("9-")) return "sensor"; // 2-byte float family
    if (nd === "10-1") return "sensor"; // time
    if (nd === "11-1") return "sensor"; // date
    if (nd === "1-10") return isDoorLike(name) ? "cover" : "switch"; // open/close
    if (nd === "1-2") return "switch"; // on/off (complement)
    if (nd === "2-1") return "switch"; // 2-bit controlled
    if (nd === "20-102") return "sensor"; // HVAC mode (evt. later -> climate)
  }

  const n = name.toLowerCase();
  if (isLA(name) || /(licht|light|lamp|dim)/.test(n)) return "light";
  if (/(temp|temperatuur|temperature|hum|co2|lux)/.test(n)) return "sensor";
  if (/(rolluik|jaloezie|blind|shutter|cover)/.test(n)) return "cover";
  if (isStatusName(name)) return "binary_sensor";
  if (/(aan|uit|switch|centraal)/.test(n)) return "switch";
  return "unknown";
}
