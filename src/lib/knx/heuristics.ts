import type { HAType } from "../types";
import { normalizeDptToDot, normalizeDptToHyphen } from "./utils";

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

export function guessEntityType(dpt: string | undefined, name: string): HAType {
  const nd = normalizeDptToHyphen(dpt);
  const dot = normalizeDptToDot(dpt);
  const lowerName = name.toLowerCase();
  const isSwitchLike = SWITCH_HINT_RE.test(lowerName);
  const hasTimeHint = TIME_HINT_RE.test(lowerName);
  const hasDateHint = DATE_HINT_RE.test(lowerName);
  const hasDateTimeHint = hasTimeHint && hasDateHint;
  const explicitDateTimeHint = DATETIME_HINT_RE.test(lowerName);

  const isTimeDpt = dot === "10.001" || nd === "10-1";
  const isDateDpt = dot === "11.001" || nd === "11-1";
  const isDateTimeDpt = dot === "19.001" || nd === "19-1";

  if (isDateTimeDpt) {
    if (explicitDateTimeHint || hasDateTimeHint) {
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
