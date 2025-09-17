import YAML from "yaml";
import {
  ExportOptions,
  KnxCatalog,
  HaSwitch,
  HaBinarySensor,
  HaLight,
  HaSensor,
  HaCover,
  UnknownEntity,
} from "./types";
import {
  buildLaLightAggregates,
  buildSwitchAggregates,
  buildCoverAggregates,
  collectConsumedIds,
  mapSingleGaToEntity,
} from "./aggregate";

export interface HaEntities {
  switches: HaSwitch[];
  binarySensors: HaBinarySensor[];
  lights: HaLight[];
  sensors: HaSensor[];
  covers: HaCover[];
  unknowns: UnknownEntity[];
}

export function buildHaEntities(
  catalog: KnxCatalog,
  opts: ExportOptions = {}
): HaEntities {
  const switches: HaSwitch[] = [];
  const binarySensors: HaBinarySensor[] = [];
  const lights: HaLight[] = [];
  const sensors: HaSensor[] = [];
  const covers: HaCover[] = [];
  const unknowns: UnknownEntity[] = [];

  const laAggs = buildLaLightAggregates(catalog.group_addresses);
  for (const a of laAggs) {
    if (!a.on_off) continue;
    const entry: HaLight = { name: a.name, address: a.on_off };
    if (a.on_off_state) entry.state_address = a.on_off_state;
    if (a.brightness) entry.brightness_address = a.brightness;
    if (a.brightness_state) entry.brightness_state_address = a.brightness_state;
    lights.push(entry);
  }

  const switchAggs = buildSwitchAggregates(catalog.group_addresses);
  for (const s of switchAggs) {
    const entry: HaSwitch = { name: s.name, address: s.address! };
    if (s.state_address) entry.state_address = s.state_address;
    else entry.respond_to_read = true;
    switches.push(entry);
  }

  const coverAggs = buildCoverAggregates(catalog.group_addresses);
  for (const c of coverAggs) {
    const entry: HaCover = { name: c.name };
    if (c.move_long_address) entry.move_long_address = c.move_long_address;
    if (c.move_short_address) entry.move_short_address = c.move_short_address;
    if (c.stop_address) entry.stop_address = c.stop_address;
    if (c.position_address) entry.position_address = c.position_address;
    if (c.position_state_address)
      entry.position_state_address = c.position_state_address;
    if (c.angle_address) entry.angle_address = c.angle_address;
    if (c.angle_state_address)
      entry.angle_state_address = c.angle_state_address;
    if (c.invert_position) entry.invert_position = true;
    if (c.invert_angle) entry.invert_angle = true;
    covers.push(entry);
  }

  const consumed = collectConsumedIds(laAggs, switchAggs, coverAggs);
  for (const ga of catalog.group_addresses) {
    if (consumed.has(ga.id)) continue;

    const mapped = mapSingleGaToEntity(ga);
    switch (mapped.domain) {
      case "switch":
        switches.push(mapped.payload);
        break;
      case "binary_sensor":
        binarySensors.push(mapped.payload);
        break;
      case "light":
        lights.push(mapped.payload);
        break;
      case "sensor":
        sensors.push(mapped.payload);
        break;
      case "cover":
        covers.push(mapped.payload);
        break;
      case "_unknown":
        unknowns.push(mapped.payload);
        break;
    }
  }

  const finalUnknowns = opts.dropReserveFromUnknown
    ? unknowns.filter((x) => x.name.trim().toLowerCase() !== "reserve")
    : unknowns;

  return {
    switches,
    binarySensors,
    lights,
    sensors,
    covers,
    unknowns: finalUnknowns,
  };
}

export function toHomeAssistantYaml(
  catalog: KnxCatalog,
  opts: ExportOptions = {}
): string {
  const ent = buildHaEntities(catalog, opts);

  const knx: Record<string, unknown> = {};
  if (ent.switches.length) knx["switch"] = ent.switches;
  if (ent.binarySensors.length) knx["binary_sensor"] = ent.binarySensors;
  if (ent.lights.length) knx["light"] = ent.lights;
  if (ent.sensors.length) knx["sensor"] = ent.sensors;
  if (ent.covers.length) knx["cover"] = ent.covers;
  if (ent.unknowns.length) knx["_unknown"] = ent.unknowns;

  return YAML.stringify({ knx }, { aliasDuplicateObjects: false });
}

export function toCatalogYaml(catalog: KnxCatalog): string {
  const data = {
    project_name: catalog.project_name ?? null,
    group_addresses: catalog.group_addresses.map((ga) => ({
      id: ga.id,
      name: ga.name,
      address: ga.address,
      dpt: ga.dpt,
      description: ga.description,
    })),
  };
  return YAML.stringify(data, { aliasDuplicateObjects: false });
}

export interface EntitySummary {
  counts: {
    switch: number;
    binary_sensor: number;
    light: number;
    sensor: number;
    cover: number;
    _unknown: number;
    total: number;
  };
  sensorsByType: Record<string, number>;
}

export function summarizeEntities(ent: HaEntities): EntitySummary {
  const counts = {
    switch: ent.switches.length,
    binary_sensor: ent.binarySensors.length,
    light: ent.lights.length,
    sensor: ent.sensors.length,
    cover: ent.covers.length,
    _unknown: ent.unknowns.length,
    total:
      ent.switches.length +
      ent.binarySensors.length +
      ent.lights.length +
      ent.sensors.length +
      ent.covers.length +
      ent.unknowns.length,
  };

  const byType: Record<string, number> = {};
  for (const s of ent.sensors) {
    byType[s.type] = (byType[s.type] ?? 0) + 1;
  }

  return { counts, sensorsByType: byType };
}
