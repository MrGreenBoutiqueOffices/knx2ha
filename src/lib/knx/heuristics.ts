import { HAType } from "./types";

function isStatusName(name: string): boolean {
  return /\bstatus\b/i.test(name);
}

function isDoorLike(name: string): boolean {
  return /(deur|schuifdeur|door)/i.test(name);
}

export function isLA(name: string): boolean {
  return /^LA\d+/i.test(name) || /^LA\d+-/i.test(name);
}

export function guessEntityType(dpt: string | undefined, name: string): HAType {
  if (dpt) {
    if (/^DPST?-1-1$/i.test(dpt))
      return isStatusName(name) ? "binary_sensor" : "switch";
    if (/^DPST?-3-7$/i.test(dpt)) return "light";
    if (/^DPST?-5-1$/i.test(dpt)) return "light";
    if (/^DPST?-9-\d+$/i.test(dpt)) return "sensor";
    if (/^DPST?-10-1$/i.test(dpt)) return "sensor";
    if (/^DPST?-11-1$/i.test(dpt)) return "sensor";
    if (/^DPST?-1-10$/i.test(dpt)) return isDoorLike(name) ? "cover" : "switch";
    if (/^DPST?-1-2$/i.test(dpt)) return "switch";
    if (/^DPST?-2-1$/i.test(dpt)) return "switch";
    if (/^DPST?-20-102$/i.test(dpt)) return "sensor";
  }
  const n = name.toLowerCase();
  if (isLA(name) || /(licht|light|lamp|dim)/.test(n)) return "light";
  if (/(temp|temperatuur|temperature|hum|co2|lux)/.test(n)) return "sensor";
  if (/(rolluik|jaloezie|blind|shutter|cover)/.test(n)) return "cover";
  if (isStatusName(name)) return "binary_sensor";
  if (/(aan|uit|switch|centraal)/.test(n)) return "switch";
  return "unknown";
}
