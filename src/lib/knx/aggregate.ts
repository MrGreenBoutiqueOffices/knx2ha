import { GroupAddress, LightAggregate } from "./types";
import { isLA, guessEntityType } from "./heuristics";
import { parseAddress } from "./utils";

/** Bundelt LA* armaturen tot één light met on/off + brightness + state. */
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

    const dpt = ga.dpt ?? "";
    if (/^DPST?-1-1$/i.test(dpt)) {
      if (parts.middle === 1) agg.on_off = ga.address;
      if (parts.middle === 5) agg.on_off_state = ga.address;
      agg.consumedIds.add(ga.id);
    } else if (/^DPST?-3-7$/i.test(dpt)) {
      if (parts.middle === 2) agg.dimming = ga.address;
      agg.consumedIds.add(ga.id);
    } else if (/^DPST?-5-1$/i.test(dpt)) {
      if (parts.middle === 3) agg.brightness = ga.address;
      if (parts.middle === 4) agg.brightness_state = ga.address;
      agg.consumedIds.add(ga.id);
    }
  }

  return Array.from(byBase.values()).filter(
    (a) => a.on_off || a.brightness || a.dimming
  );
}

/** Handige helper: bepaal of GA al door aggregatie is opgegeten */
export function collectConsumedIds(aggs: LightAggregate[]): Set<string> {
  const consumed = new Set<string>();
  for (const a of aggs) a.consumedIds.forEach((id) => consumed.add(id));
  return consumed;
}

/** Simpele “fallback”-mapping voor losse GA’s die geen LA* zijn. */
export function mapSingleGaToEntity(ga: GroupAddress): {
  domain: string;
  payload: Record<string, unknown>;
} {
  const t = guessEntityType(ga.dpt, ga.name);
  switch (t) {
    case "switch":
      return {
        domain: "switch",
        payload: { name: ga.name, state_address: ga.address },
      };
    case "binary_sensor":
      return {
        domain: "binary_sensor",
        payload: { name: ga.name, state_address: ga.address },
      };
    case "light":
      // Als dit een losse brightness GA is (5.001), alleen state meegeven
      if (/^DPST?-5-1$/i.test(ga.dpt ?? "")) {
        return {
          domain: "light",
          payload: { name: ga.name, brightness_state_address: ga.address },
        };
      }
      return {
        domain: "light",
        payload: { name: ga.name, state_address: ga.address },
      };
    case "sensor":
      return {
        domain: "sensor",
        payload: { name: ga.name, state_address: ga.address },
      };
    case "cover":
      return {
        domain: "cover",
        payload: { name: ga.name, move_long_address: ga.address },
      };
    default:
      return {
        domain: "_unknown",
        payload: { name: ga.name, address: ga.address, dpt: ga.dpt },
      };
  }
}
