import type { HAType } from "../types";
import { normalizeDptToDot, normalizeDptToHyphen, isSceneLikeName } from "./utils";

function isStatusName(name: string): boolean {
  return /\bstatus\b/i.test(name);
}

function isCoverLike(name: string): boolean {
  return /(rolluik|jaloezie|lamel|screen|blind|shutter|cover|gordijn|raam)/i.test(
    name
  );
}

const TIME_HINT_RE =
  /(tijd|time|clock|rtc|uur|zeit|uhr|hora|heure|std|stunden|stunde|ntp|utc)/i;
const DATE_HINT_RE = /(datum|date|calendar|kalender|fecha|jour|tag|giorno)/i;
const DATETIME_HINT_RE =
  /(datetime|date[\s_/-]*time|tijdstempel|timestamp|zeitstempel)/i;
const SWITCH_HINT_RE = /(aan|uit|switch|centraal|on|off)/i;

export function isLA(name: string): boolean {
  return /^LA\d+/i.test(name) || /^LA\d+-/i.test(name);
}

export function guessEntityType(dpt: string | undefined, name: string, address?: string): HAType {
  // Central group: treat 0/1/* as scenes regardless of DPT
  if (address && address.startsWith("0/1/")) return "scene";

  // Lighting mapping based on main=1
  if (address) {
    const m = address.match(/^(\d+)\/(\d+)\/(\d+)$/);
    if (m) {
      const main = Number(m[1]);
      const middle = Number(m[2]);
      if (main === 1) {
        // 1/1 and 1/5 are on/off; 1/2 is dimming step; 1/3 and 1/4 brightness
        if (middle === 1 || middle === 5) return "light";
        if (middle === 2) return "light";
        if (middle === 3 || middle === 4) return "light";
        // 1/0, 1/6, 1/7 are central; leave to other logic (unknown/switch)
      }
    }
  }
  const nd = normalizeDptToHyphen(dpt);
  const dot = normalizeDptToDot(dpt);
  const lowerName = name.toLowerCase();
  const isSwitchLike = SWITCH_HINT_RE.test(lowerName);
  const hasTimeHint = TIME_HINT_RE.test(lowerName);
  const hasDateHint = DATE_HINT_RE.test(lowerName);
  const hasBothTimeAndDateHints = hasTimeHint && hasDateHint;
  const explicitDateTimeHint = DATETIME_HINT_RE.test(lowerName);

  const isTimeDpt = dot === "10.001" || nd === "10-1";
  const isDateDpt = dot === "11.001" || nd === "11-1";
  const isDateTimeDpt = dot === "19.001" || nd === "19-1";

  // If the name clearly indicates a scene, honor that before strict DPT handling
  if (isSceneLikeName(lowerName)) {
    return "scene";
  }

  if (isDateTimeDpt) {
    if (explicitDateTimeHint || hasBothTimeAndDateHints) {
      return "datetime";
    }
    if (!isSwitchLike) return "datetime";
  }

  if (isTimeDpt) {
    if (hasTimeHint) return "time";
    if (!isSwitchLike) return "time";
  }

  if (isDateDpt) {
    if (hasDateHint) return "date";
    if (!isSwitchLike) return "date";
  }

  if (nd) {
    // KNX scenes are commonly DPT 18.* (DPT_SceneControl) or 17.* (scene number)
    if (nd.startsWith("18-") || nd === "18" || nd.startsWith("17-") || nd === "17") {
      return "scene";
    }
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
    if (nd === "12-1" || nd.startsWith("12-")) return "sensor";

    if (nd === "1-7" || nd === "1-8" || nd === "1-10") return "cover";
    if (nd === "1-2") return "switch";
    if (nd === "2-1") return "switch";
    if (nd === "20-102") return "sensor";
  }

  if (isLA(name) || /(licht|light|lamp|dim)/.test(lowerName)) return "light";
  if (isCoverLike(name)) return "cover";
  if (isSceneLikeName(lowerName)) return "scene";
  if (
    /(temp|temperatuur|temperature|hum|co2|lux|druk|pressure|wind|rain|flow)/.test(
      lowerName
    )
  )
    return "sensor";
  if (isStatusName(name)) return "binary_sensor";
  if (isSwitchLike) return "switch";
  return "unknown";
}
