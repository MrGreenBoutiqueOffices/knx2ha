import {
  GroupAddress,
  LightAggregate,
  MappedEntity,
  HaSwitch,
  HaBinarySensor,
  HaLight,
  HaSensor,
  HaCover,
  UnknownEntity,
} from "./types";
import { isLA, guessEntityType } from "./heuristics";
import { parseAddress } from "./utils";

/** ====================== MICRO OPTS / CACHES ====================== */
const STATUS_RE = /\bstatus\b/i;
const NAME_STRIP_RE =
  /\b(status|aan\/?uit|aan|uit|schakel|switch|cmd|command)\b/gi;

const DPT_DOT_CACHE = new Map<string, string | undefined>();

function normalizeDptToDot(dpt?: string): string | undefined {
  if (!dpt) return undefined;
  const key = dpt;
  if (DPT_DOT_CACHE.has(key)) return DPT_DOT_CACHE.get(key);

  let s = dpt.trim().toLowerCase();
  s = s.replace(/^dpst?-/, "");
  s = s.replace(/_/g, "-").replace(/\s+/g, "");
  let out: string | undefined;

  if (s.includes(".")) {
    const [m, sub] = s.split(".", 2);
    const mm = String(parseInt(m, 10));
    const ss = sub ? sub.replace(/^0+/, "") : "";
    out = ss ? `${mm}.${ss.padStart(3, "0")}` : mm;
  } else if (s.includes("-")) {
    const [m, sub] = s.split("-", 2);
    const mm = String(parseInt(m, 10));
    const ss = sub ? sub.replace(/^0+/, "") : "";
    out = ss ? `${mm}.${ss.padStart(3, "0")}` : mm;
  } else if (/^\d+$/.test(s)) {
    out = String(parseInt(s, 10));
  }

  DPT_DOT_CACHE.set(key, out);
  return out;
}

/** ====================== LIGHT AGGREGATIE ====================== */
export function buildLaLightAggregates(gas: GroupAddress[]): LightAggregate[] {
  const byBase = new Map<string, LightAggregate>();

  for (const ga of gas) {
    if (!isLA(ga.name)) continue;
    const parts = parseAddress(ga.address);
    if (!parts) continue;

    const base = ga.name.trim();
    let agg = byBase.get(base);
    if (!agg) {
      agg = { name: base, consumedIds: new Set<string>() };
      byBase.set(base, agg);
    }

    const dpt = (ga.dpt ?? "").toLowerCase();
    if (/^dpst?-1-1$/.test(dpt)) {
      if (parts.middle === 1) agg.on_off = ga.address;
      if (parts.middle === 5) agg.on_off_state = ga.address;
      agg.consumedIds.add(ga.id);
    } else if (/^dpst?-3-7$/.test(dpt)) {
      if (parts.middle === 2) agg.dimming = ga.address;
      agg.consumedIds.add(ga.id);
    } else if (/^dpst?-5-1$/.test(dpt)) {
      if (parts.middle === 3) agg.brightness = ga.address;
      if (parts.middle === 4) agg.brightness_state = ga.address;
      agg.consumedIds.add(ga.id);
    }
  }

  return Array.from(byBase.values()).filter(
    (a) => a.on_off || a.brightness || a.dimming
  );
}

/** ====================== SWITCH AGGREGATIE ====================== */
function isStatusName(name: string): boolean {
  return STATUS_RE.test(name);
}
function normalizeBaseName(name: string): string {
  let n = name.toLowerCase().trim();
  n = n.replace(NAME_STRIP_RE, "");
  n = n.replace(/\s+/g, " ").trim();
  return n.length ? n : name.toLowerCase().trim();
}

export interface SwitchAggregate {
  name: string;
  address?: string;
  state_address?: string;
  consumedIds: Set<string>;
}

export function buildSwitchAggregates(gas: GroupAddress[]): SwitchAggregate[] {
  const oneBit = gas.filter((g) => /^dpst?-1-1$/i.test(g.dpt ?? ""));
  const byBase = new Map<string, SwitchAggregate>();

  for (const ga of oneBit) {
    const base = normalizeBaseName(ga.name);
    let agg = byBase.get(base);
    if (!agg) {
      agg = { name: ga.name, consumedIds: new Set<string>() };
      byBase.set(base, agg);
    }

    if (isStatusName(ga.name)) {
      if (!agg.state_address) agg.state_address = ga.address;
      agg.consumedIds.add(ga.id);
    } else {
      if (!agg.address) {
        agg.address = ga.address;
        agg.name = ga.name;
      }
      agg.consumedIds.add(ga.id);
    }
  }
  return Array.from(byBase.values()).filter((a) => !!a.address);
}

export function collectConsumedIds(
  ...aggs: Array<{ consumedIds: Set<string> }[]>
): Set<string> {
  const consumed = new Set<string>();
  for (const group of aggs)
    for (const a of group) a.consumedIds.forEach((id) => consumed.add(id));
  return consumed;
}

/** ====================== SENSOR TYPE-MAPPING ====================== */
const DPT_TO_HA: Record<string, string> = {
  // 5.*
  "5": "1byte_unsigned",
  "5.001": "percent",
  "5.003": "angle",
  "5.004": "percentU8",
  "5.005": "decimal_factor",
  "5.006": "tariff",
  "5.010": "pulse",
  // 6.*
  "6": "1byte_signed",
  "6.001": "percentV8",
  "6.010": "counter_pulses",
  // 7.*
  "7": "2byte_unsigned",
  "7.001": "pulse_2byte",
  "7.002": "time_period_msec",
  "7.003": "time_period_10msec",
  "7.004": "time_period_100msec",
  "7.005": "time_period_sec",
  "7.006": "time_period_min",
  "7.007": "time_period_hrs",
  "7.011": "length_mm",
  "7.012": "current",
  "7.013": "brightness",
  "7.600": "color_temperature",
  // 8.*
  "8": "2byte_signed",
  "8.001": "pulse_2byte_signed",
  "8.002": "delta_time_ms",
  "8.003": "delta_time_10ms",
  "8.004": "delta_time_100ms",
  "8.005": "delta_time_sec",
  "8.006": "delta_time_min",
  "8.007": "delta_time_hrs",
  "8.010": "percentV16",
  "8.011": "rotation_angle",
  "8.012": "length_m",
  // 9.*
  "9": "2byte_float",
  "9.001": "temperature",
  "9.002": "temperature_difference_2byte",
  "9.003": "temperature_a",
  "9.004": "illuminance",
  "9.005": "wind_speed_ms",
  "9.006": "pressure_2byte",
  "9.007": "humidity",
  "9.008": "ppm",
  "9.009": "air_flow",
  "9.010": "time_1",
  "9.011": "time_2",
  "9.020": "voltage",
  "9.021": "curr",
  "9.022": "power_density",
  "9.023": "kelvin_per_percent",
  "9.024": "power_2byte",
  "9.025": "volume_flow",
  "9.026": "rain_amount",
  "9.027": "temperature_f",
  "9.028": "wind_speed_kmh",
  "9.029": "absolute_humidity",
  "9.030": "concentration_ugm3",
  // 12.*
  "12": "4byte_unsigned",
  "12.001": "pulse_4_ucount",
  "12.100": "long_time_period_sec",
  "12.101": "long_time_period_min",
};

const FALLBACK_PATTERNS = [
  [/temp|temperatuur/i, "temperature"],
  [/hum|humidity|rv/i, "humidity"],
  [/lux|illuminance|lichtsterkte/i, "illuminance"],
  [/\bppm\b|co2/i, "ppm"],
  [/volt|spanning|voltage/i, "voltage"],
  [/(^|\W)(amp|stroom|current|ma|a)($|\W)/i, "curr"],
  [/power|vermogen|watt|kw\b/i, "power_2byte"],
  [/press|druk/i, "pressure_2byte"],
  [/wind.*km\/?h/i, "wind_speed_kmh"],
  [/wind|windsnelheid/i, "wind_speed_ms"],
  [/rain|regen/i, "rain_amount"],
  [/flow|debiet/i, "volume_flow"],
] as const;

function fallbackTypeFromName(name?: string): string | undefined {
  if (!name) return undefined;
  for (const [re, t] of FALLBACK_PATTERNS) if (re.test(name)) return t;
  return undefined;
}

export function dptToSensorType(
  dpt?: string,
  name?: string
): string | undefined {
  const norm = normalizeDptToDot(dpt);
  if (norm && DPT_TO_HA[norm]) return DPT_TO_HA[norm];

  if (norm === "5") return DPT_TO_HA["5"];
  if (norm === "6") return DPT_TO_HA["6"];
  if (norm === "7") return DPT_TO_HA["7"];
  if (norm === "8") return DPT_TO_HA["8"];
  if (norm === "9") return DPT_TO_HA["9"];
  if (norm === "12") return DPT_TO_HA["12"];

  return fallbackTypeFromName(name);
}

/** ====================== Fallback mapping for single GA's ====================== */
export function mapSingleGaToEntity(ga: GroupAddress): MappedEntity {
  const t = guessEntityType(ga.dpt, ga.name);

  if (t === "switch") {
    const payload: HaSwitch = { name: ga.name, address: ga.address };
    return { domain: "switch", payload };
  }

  if (t === "binary_sensor") {
    const payload: HaBinarySensor = {
      name: ga.name,
      state_address: ga.address,
    };
    return { domain: "binary_sensor", payload };
  }

  if (t === "light") {
    if (/^dpst?-1-1$/i.test(ga.dpt ?? "")) {
      const payload: HaLight = { name: ga.name, address: ga.address };
      return { domain: "light", payload };
    }
    if (/^dpst?-5-1$/i.test(ga.dpt ?? "")) {
      const payload: HaSensor = {
        name: ga.name,
        state_address: ga.address,
        type: "percent",
      };
      return { domain: "sensor", payload };
    }
  }

  if (t === "sensor") {
    const sensorType = dptToSensorType(ga.dpt, ga.name);
    if (sensorType) {
      const payload: HaSensor = {
        name: ga.name,
        state_address: ga.address,
        type: sensorType,
      };
      return { domain: "sensor", payload };
    }
    const unknownPayload: UnknownEntity = {
      name: ga.name,
      address: ga.address,
      dpt: ga.dpt,
    };
    return { domain: "_unknown", payload: unknownPayload };
  }

  if (t === "cover") {
    const payload: HaCover = { name: ga.name, move_long_address: ga.address };
    return { domain: "cover", payload };
  }

  const payload: UnknownEntity = {
    name: ga.name,
    address: ga.address,
    dpt: ga.dpt,
  };
  return { domain: "_unknown", payload };
}
