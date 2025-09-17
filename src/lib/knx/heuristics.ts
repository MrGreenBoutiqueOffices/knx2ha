import { HAType } from "../types";

/** -------- regex precompiled -------- */
const RE_STATUS = /\bstatus\b/i;
const RE_LA = /^LA\d+(-|$)/i;

const RE_LIGHT_NAME = /(licht|light|lamp|dim|brightness|dimming)/i;
const RE_SENSOR_NAME = /(temp|temperatuur|temperature|hum|co2|lux)/i;
const RE_COVER_NAME =
  /(rolluik|jaloezie|blind|shutter|cover|screen|gordijn|lamel|lamellen|venetian|shade|zonwering|raam)/i;
const RE_POSITION_NAME = /(positie|position|stand|hoogte|percentage|percent)/i;

const RE_DOORLIKE = /(deur|schuifdeur|door)/i;

/** DPT regexen */
const RE_DPT_1_1 = /^DPST?-1-1$/i;
const RE_DPT_3_7 = /^DPST?-3-7$/i;
const RE_DPT_5_1 = /^DPST?-5-1$/i;
const RE_DPT_9_X = /^DPST?-9-\d+$/i;
const RE_DPT_10_1 = /^DPST?-10-1$/i;
const RE_DPT_11_1 = /^DPST?-11-1$/i;
const RE_DPT_1_10 = /^DPST?-1-10$/i;
const RE_DPT_1_2 = /^DPST?-1-2$/i;
const RE_DPT_2_1 = /^DPST?-2-1$/i;
const RE_DPT_20_102 = /^DPST?-20-102$/i;

/** -------- helpers -------- */
export function isLA(name: string): boolean {
  return RE_LA.test(name);
}
export function isStatusName(name: string): boolean {
  return RE_STATUS.test(name);
}
export function isCoverLike(name: string): boolean {
  const n = name.toLowerCase();
  return RE_COVER_NAME.test(n) || RE_POSITION_NAME.test(n);
}
function isDoorLike(name: string): boolean {
  return RE_DOORLIKE.test(name);
}

/** -------- memoization -------- */
const GUESS_CACHE = new Map<string, HAType>();
function cacheKey(dpt?: string, name?: string): string {
  return `${(dpt || "").toLowerCase()}@@${(name || "").toLowerCase()}`;
}

export function guessEntityType(dpt: string | undefined, name: string): HAType {
  const key = cacheKey(dpt, name);
  const hit = GUESS_CACHE.get(key);
  if (hit) return hit;

  let out: HAType = "unknown";

  if (dpt) {
    if (RE_DPT_1_1.test(dpt))
      out = isStatusName(name) ? "binary_sensor" : "switch";
    else if (RE_DPT_3_7.test(dpt)) out = "light";
    else if (RE_DPT_5_1.test(dpt)) {
      if (isLA(name) || RE_LIGHT_NAME.test(name)) out = "light";
      else if (isCoverLike(name)) out = "cover";
      else out = "sensor";
    } else if (RE_DPT_9_X.test(dpt)) out = "sensor";
    else if (RE_DPT_10_1.test(dpt)) out = "sensor";
    else if (RE_DPT_11_1.test(dpt)) out = "sensor";
    else if (RE_DPT_1_10.test(dpt)) out = isDoorLike(name) ? "cover" : "switch";
    else if (RE_DPT_1_2.test(dpt)) out = "switch";
    else if (RE_DPT_2_1.test(dpt)) out = "switch";
    else if (RE_DPT_20_102.test(dpt)) out = "sensor";
  }

  if (out === "unknown") {
    const n = name.toLowerCase();
    if (isLA(name) || RE_LIGHT_NAME.test(n)) out = "light";
    else if (RE_SENSOR_NAME.test(n)) out = "sensor";
    else if (isCoverLike(n)) out = "cover";
    else if (isStatusName(name)) out = "binary_sensor";
    else out = "switch";
  }

  GUESS_CACHE.set(key, out);
  return out;
}

export function clearHeuristicsCache(): void {
  GUESS_CACHE.clear();
}
