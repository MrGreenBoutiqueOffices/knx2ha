import YAML, { Document, YAMLMap, YAMLSeq, Scalar } from "yaml";
import {
  ExportOptions,
  KnxCatalog,
  HaSwitch,
  HaBinarySensor,
  HaLight,
  HaSensor,
  HaTime,
  HaDate,
  HaDateTime,
  HaCover,
  UnknownEntity,
  GroupAddress,
} from "../types";
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
  times: HaTime[];
  dates: HaDate[];
  datetimes: HaDateTime[];
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
  const times: HaTime[] = [];
  const dates: HaDate[] = [];
  const datetimes: HaDateTime[] = [];
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
      case "time":
        times.push(mapped.payload);
        break;
      case "date":
        dates.push(mapped.payload);
        break;
      case "datetime":
        datetimes.push(mapped.payload);
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
    times,
    dates,
    datetimes,
    covers,
    unknowns: finalUnknowns,
  };
}

function isQuotedField(key: string): boolean {
  if (key === "name") return true;
  return (
    key === "address" ||
    key.endsWith("_address") ||
    key.endsWith("_state_address")
  );
}

function dq(doc: Document.Parsed, value: string): Scalar<string> {
  const node = doc.createNode(value) as Scalar<string>;
  node.type = "QUOTE_DOUBLE";
  return node;
}

function domainListToYaml<T extends object>(
  doc: Document.Parsed,
  list: T[]
): YAMLSeq<YAMLMap> {
  const seq = doc.createNode([]) as YAMLSeq<YAMLMap>;

  for (const item of list) {
    const map = doc.createNode({}) as YAMLMap;
    for (const [k, v] of Object.entries(item)) {
      if (v === undefined) continue;
      if (typeof v === "string" && isQuotedField(k)) {
        map.set(k, dq(doc, v));
      } else {
        map.set(k, v as unknown);
      }
    }
    seq.add(map);
  }
  return seq;
}

function entitiesToYaml(doc: Document.Parsed, ent: HaEntities): YAMLMap {
  const root = doc.createNode({ knx: {} }) as YAMLMap;
  const knx = root.get("knx") as YAMLMap;

  if (ent.switches.length)
    knx.set("switch", domainListToYaml(doc, ent.switches));
  if (ent.binarySensors.length)
    knx.set("binary_sensor", domainListToYaml(doc, ent.binarySensors));
  if (ent.lights.length) knx.set("light", domainListToYaml(doc, ent.lights));
  if (ent.sensors.length) knx.set("sensor", domainListToYaml(doc, ent.sensors));
  if (ent.times.length) knx.set("time", domainListToYaml(doc, ent.times));
  if (ent.dates.length) knx.set("date", domainListToYaml(doc, ent.dates));
  if (ent.datetimes.length)
    knx.set("datetime", domainListToYaml(doc, ent.datetimes));
  if (ent.covers.length) knx.set("cover", domainListToYaml(doc, ent.covers));
  if (ent.unknowns.length)
    knx.set("_unknown", domainListToYaml(doc, ent.unknowns));

  return root;
}

export function toHomeAssistantYaml(
  catalog: KnxCatalog,
  opts: ExportOptions = {}
): string {
  const ent = buildHaEntities(catalog, opts);

  return haEntitiesToYaml(ent);
}

export function haEntitiesToYaml(ent: HaEntities): string {
  const doc = new YAML.Document();
  doc.contents = entitiesToYaml(doc as Document.Parsed, ent);
  return String(doc);
}

export function toCatalogYaml(catalog: KnxCatalog): string {
  return YAML.stringify(
    {
      project_name: catalog.project_name ?? null,
      group_addresses: catalog.group_addresses.map((ga: GroupAddress) => ({
        id: ga.id,
        name: ga.name,
        address: ga.address,
        dpt: ga.dpt,
        description: ga.description,
      })),
    },
    { aliasDuplicateObjects: false }
  );
}

export interface EntitySummary {
  counts: {
    switch: number;
    binary_sensor: number;
    light: number;
    sensor: number;
    time: number;
    date: number;
    datetime: number;
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
    time: ent.times.length,
    date: ent.dates.length,
    datetime: ent.datetimes.length,
    cover: ent.covers.length,
    _unknown: ent.unknowns.length,
    total:
      ent.switches.length +
      ent.binarySensors.length +
      ent.lights.length +
      ent.sensors.length +
      ent.times.length +
      ent.dates.length +
      ent.datetimes.length +
      ent.covers.length +
      ent.unknowns.length,
  };

  const byType: Record<string, number> = {};
  for (const s of ent.sensors) byType[s.type] = (byType[s.type] ?? 0) + 1;

  return { counts, sensorsByType: byType };
}
