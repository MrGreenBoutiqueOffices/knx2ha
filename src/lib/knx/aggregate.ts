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

function isStatusName(name: string): boolean {
  return /\bstatus\b/i.test(name);
}
function normalizeBaseName(name: string): string {
  let n = name.toLowerCase().trim();
  n = n.replace(
    /\b(status|aan\/?uit|aan|uit|schakel|switch|cmd|command)\b/g,
    ""
  );
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
  for (const group of aggs) {
    for (const a of group) a.consumedIds.forEach((id) => consumed.add(id));
  }
  return consumed;
}

function dptToSensorType(dpt?: string, name?: string): string | undefined {
  const d = (dpt ?? "").toLowerCase();
  if (d === "dpst-5-1" || d === "5.001") return "percent";
  if (d === "dpst-9-1" || d === "9.001") return "temperature";
  if (/(temperatuur|temperature|temp)/i.test(name ?? "") && d.startsWith("9."))
    return "temperature";
  return undefined;
}

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
      const sensorType = "percent";
      const payload: HaSensor = {
        name: ga.name,
        state_address: ga.address,
        type: sensorType,
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
