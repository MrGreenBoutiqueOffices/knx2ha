import type { HAType } from "../types";
import { normalizeDptToHyphen } from "./utils";

function isStatusName(name: string): boolean {
  return /\bstatus\b/i.test(name);
}

function isCoverLike(name: string): boolean {
  return /(rolluik|jaloezie|lamel|screen|blind|shutter|cover|gordijn|raam)/i.test(
    name
  );
}

export function isLA(name: string): boolean {
  return /^LA\d+/i.test(name) || /^LA\d+-/i.test(name);
}

export function guessEntityType(dpt: string | undefined, name: string): HAType {
  const nd = normalizeDptToHyphen(dpt);

  if (nd) {
    if (nd === "1-1") return isStatusName(name) ? "binary_sensor" : "switch";
    if (nd === "3-7") return "light";
    if (nd === "5-1")
      return isLA(name) ? "light" : isCoverLike(name) ? "cover" : "sensor"; // brightness vs position
    if (nd === "5-3") return isCoverLike(name) ? "cover" : "sensor"; // tilt/angle
    if (
      nd.startsWith("7-") ||
      nd.startsWith("8-") ||
      nd.startsWith("9-") ||
      nd === "9"
    )
      return "sensor";
    if (nd === "10-1") return "sensor";
    if (nd === "11-1") return "sensor";
    if (nd === "12-1" || nd.startsWith("12-")) return "sensor";

    if (nd === "1-7" || nd === "1-8" || nd === "1-10") return "cover";
    if (nd === "1-2") return "switch";
    if (nd === "2-1") return "switch";
    if (nd === "20-102") return "sensor";
  }

  const n = name.toLowerCase();
  if (isLA(name) || /(licht|light|lamp|dim)/.test(n)) return "light";
  if (isCoverLike(name)) return "cover";
  if (
    /(temp|temperatuur|temperature|hum|co2|lux|druk|pressure|wind|rain|flow)/.test(
      n
    )
  )
    return "sensor";
  if (isStatusName(name)) return "binary_sensor";
  if (/(aan|uit|switch|centraal)/.test(n)) return "switch";
  return "unknown";
}
