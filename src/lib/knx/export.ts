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
  KnxFlags,
  KnxGroupLevel,
  KnxGroupAddress,
} from "../types";
import {
  buildLaLightAggregates,
  buildLinkedLightAggregates,
  buildAddressLightAggregates,
  buildSwitchAggregates,
  buildCoverAggregates,
  collectConsumedIds,
  mapSingleGaToEntity,
} from "./aggregate";
import { buildEntitiesFromCatalog } from "./map";
import { KnxLinkInfo, HaScene } from "../types";

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
  scenes: HaScene[];
}

type LegacyGA = { id: string; name?: string; address: string; dpt?: string; description?: string };
export type LegacyCatalog = { project_name?: string; group_addresses?: LegacyGA[] };

type BuildCatalogInput = KnxCatalog | LegacyCatalog;

export function buildHaEntities(
  catalog: BuildCatalogInput,
  opts: ExportOptions = {}
): HaEntities {
  // If rich catalog (devices/channels/com objects present), prefer structured mapping
  const isRich = (c: BuildCatalogInput): c is KnxCatalog =>
    (c as KnxCatalog).devices !== undefined &&
    Array.isArray((c as KnxCatalog).devices) &&
    Boolean((c as KnxCatalog).groupAddresses?.flat?.length);
  if (isRich(catalog)) {
    const mapped = buildEntitiesFromCatalog(catalog);
    const ent: HaEntities = {
      switches: [],
      binarySensors: [],
      lights: [],
      sensors: [],
      times: [],
      dates: [],
      datetimes: [],
      covers: [],
      unknowns: [],
      scenes: [],
    };
    for (const m of mapped) {
      if (m.domain === "switch") ent.switches.push(m.payload);
      else if (m.domain === "binary_sensor") ent.binarySensors.push(m.payload);
      else if (m.domain === "light") ent.lights.push(m.payload);
      else if (m.domain === "sensor") ent.sensors.push(m.payload);
      else if (m.domain === "time") ent.times.push(m.payload);
      else if (m.domain === "date") ent.dates.push(m.payload);
      else if (m.domain === "datetime") ent.datetimes.push(m.payload);
      else if (m.domain === "cover") ent.covers.push(m.payload);
      else if (m.domain === "scene") ent.scenes.push(m.payload);
      else if (m.domain === "_unknown") ent.unknowns.push(m.payload);
    }
    const total =
      ent.switches.length +
      ent.binarySensors.length +
      ent.lights.length +
      ent.sensors.length +
      ent.times.length +
      ent.dates.length +
      ent.datetimes.length +
      ent.covers.length +
      ent.scenes.length +
      ent.unknowns.length;
    if (total > 0) return ent;
  }
  const dropReserve = Boolean(opts.dropReserveFromUnknown);
  const switches: HaSwitch[] = [];
  const binarySensors: HaBinarySensor[] = [];
  const lights: HaLight[] = [];
  const sensors: HaSensor[] = [];
  const times: HaTime[] = [];
  const dates: HaDate[] = [];
  const datetimes: HaDateTime[] = [];
  const covers: HaCover[] = [];
  const unknowns: UnknownEntity[] = [];
  const scenes: HaScene[] = [];

  // Optional: use link contexts to improve pairing
  const linksByGa = (catalog as KnxCatalog).links && (catalog as KnxCatalog).links!.length
    ? new Map<string, KnxLinkInfo>((catalog as KnxCatalog).links!.map((l) => [l.gaId, l]))
    : undefined;

  // Link-driven aggregates
  const linkedLaAggs = buildLinkedLightAggregates(
    (catalog as LegacyCatalog).group_addresses ?? [],
    linksByGa
  );
  const addrAggs = linkedLaAggs.length
    ? []
    : buildAddressLightAggregates((catalog as LegacyCatalog).group_addresses ?? []);
  const laAggs = linkedLaAggs.length
    ? linkedLaAggs
    : addrAggs.length
    ? addrAggs
    : buildLaLightAggregates((catalog as LegacyCatalog).group_addresses ?? []);
  for (const a of laAggs) {
    if (!a.on_off) continue;
    const entry: HaLight = { name: a.name, address: a.on_off };
    if (a.on_off_state) entry.state_address = a.on_off_state;
    if (a.brightness) entry.brightness_address = a.brightness;
    if (a.brightness_state) entry.brightness_state_address = a.brightness_state;
    if (!(dropReserve && (entry.name ?? "").trim().toLowerCase() === "reserve"))
      lights.push(entry);
  }

  const switchAggs = buildSwitchAggregates((catalog as LegacyCatalog).group_addresses ?? [], linksByGa);
  for (const s of switchAggs) {
    const entry: HaSwitch = { name: s.name, address: s.address! };
    if (s.state_address) entry.state_address = s.state_address;
    else entry.respond_to_read = true;
    if (!(dropReserve && (entry.name ?? "").trim().toLowerCase() === "reserve"))
      switches.push(entry);
  }

  const coverAggs = buildCoverAggregates((catalog as LegacyCatalog).group_addresses ?? [], linksByGa);
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
    if (!(dropReserve && (entry.name ?? "").trim().toLowerCase() === "reserve"))
      covers.push(entry);
  }

  const consumed = collectConsumedIds(laAggs, switchAggs, coverAggs);
  for (const ga of (catalog as LegacyCatalog).group_addresses ?? []) {
    if (consumed.has(ga.id)) continue;

    const mapped = mapSingleGaToEntity(ga);
    switch (mapped.domain) {
      case "switch":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          switches.push(mapped.payload);
        break;
      case "binary_sensor":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          binarySensors.push(mapped.payload);
        break;
      case "light":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          lights.push(mapped.payload);
        break;
      case "sensor":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          sensors.push(mapped.payload);
        break;
      case "time":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          times.push(mapped.payload);
        break;
      case "date":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          dates.push(mapped.payload);
        break;
      case "datetime":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          datetimes.push(mapped.payload);
        break;
      case "cover":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          covers.push(mapped.payload);
        break;
      case "scene":
        if (!(dropReserve && (mapped.payload.name ?? "").trim().toLowerCase() === "reserve"))
          scenes.push(mapped.payload);
        break;
      case "_unknown":
        unknowns.push(mapped.payload);
        break;
    }
  }

  const finalUnknowns = dropReserve
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
    scenes,
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
  if (ent.scenes.length) knx.set("scene", domainListToYaml(doc, ent.scenes));
  if (ent.unknowns.length)
    knx.set("_unknown", domainListToYaml(doc, ent.unknowns));

  return root;
}

export function toHomeAssistantYaml(
  catalog: BuildCatalogInput,
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

// Keep these types exported to help tests/consumers using legacy shape

export function toCatalogYaml(catalog: KnxCatalog | LegacyCatalog): string {
  // Backward-compatible path: if rich structures are missing, emit legacy minimal YAML
  // Expected by older tests/consumers that only provide catalog.group_addresses and project_name
  const isRich = (c: KnxCatalog | LegacyCatalog): c is KnxCatalog =>
    "topology" in c && "groupAddresses" in c && !!(c as KnxCatalog).groupAddresses;

  if (!isRich(catalog)) {
    const projectName = catalog.project_name ?? "Unknown";
    const list = catalog.group_addresses ?? [];
    return YAML.stringify(
      {
        project_name: projectName,
        group_addresses: list.map((ga) => ({
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
  // Canonicalize flags (prefer normalized keys if present; otherwise map common *Flag names)
  const canonFlags = (flags?: KnxFlags) => {
    if (!flags) return undefined;
    const read = (flags as KnxFlags).read ?? (flags as KnxFlags)["ReadFlag"];
    const write = (flags as KnxFlags).write ?? (flags as KnxFlags)["WriteFlag"];
    const transmit = (flags as KnxFlags).transmit ?? (flags as KnxFlags)["TransmitFlag"];
    const update = (flags as KnxFlags).update ?? (flags as KnxFlags)["UpdateFlag"];
    const readOnInit = (flags as KnxFlags).readOnInit ?? (flags as KnxFlags)["ReadOnInitFlag"];
    const out: Record<string, boolean> = {};
    if (read !== undefined) out.read = Boolean(read);
    if (write !== undefined) out.write = Boolean(write);
    if (transmit !== undefined) out.transmit = Boolean(transmit);
    if (update !== undefined) out.update = Boolean(update);
    if (readOnInit !== undefined) out.readOnInit = Boolean(readOnInit);
    return Object.keys(out).length ? out : undefined;
  };

  const meta = {
    project_name: catalog.meta.name ?? "Unknown",
    ets_version: catalog.meta.etsVersion ?? null,
    created_at: catalog.meta.createdAt ?? null,
    modified_at: catalog.meta.modifiedAt ?? null,
  };

  // Topology
  const topology = {
    areas: catalog.topology.areas.map((area) => ({
      id: area.id,
      name: area.name,
      lines: area.lines.map((line) => ({
        id: line.id,
        name: line.name,
        devices_count: line.devices.length,
      })),
    })),
  };

  // Group address tree with items
  type LevelOut = { id: string; name?: string; children?: LevelOut[]; items?: Array<{
    id: string;
    address: string;
    name?: string;
    description?: string;
    dpt?: string;
    flags?: Record<string, boolean>;
    security?: { is_secure?: boolean; keyring_ref?: string };
    priority?: string;
    bit_length?: number;
  }>; };

  const mapLevel = (lvl: KnxGroupLevel): LevelOut => ({
    id: lvl.id,
    name: lvl.name,
    children: (lvl.children || []).map(mapLevel),
    ...(lvl.items && lvl.items.length
      ? {
          items: lvl.items.map((ga: KnxGroupAddress) => ({
            id: ga.id,
            address: ga.address,
            name: ga.name,
            description: ga.description,
            dpt: ga.datapointType,
            ...(ga.flags ? { flags: canonFlags(ga.flags) } : {}),
            ...(ga.security
              ? {
                  security: {
                    is_secure: Boolean(ga.security.isSecure),
                    ...(ga.security.keyringRef
                      ? { keyring_ref: ga.security.keyringRef }
                      : {}),
                  },
                }
              : {}),
            ...(ga.priority ? { priority: ga.priority } : {}),
            ...(ga.bitLength !== undefined ? { bit_length: ga.bitLength } : {}),
          })),
        }
      : {}),
  });

  const group_addresses = {
    tree: (catalog.groupAddresses.tree.mainGroups || []).map(mapLevel),
  };

  // Devices
  const devices = catalog.devices.map((dev) => ({
    id: dev.id,
    name: dev.name,
    address: dev.address,
    manufacturer_ref: dev.manufacturerRef,
    application_program_ref: dev.applicationProgramRef,
    ...(dev.parameters && Object.keys(dev.parameters).length
      ? { parameters: dev.parameters }
      : {}),
    channels: dev.channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      com_objects: ch.comObjects.map((co) => ({
        id: co.id,
        name: co.name,
        number: co.number,
        dpt: co.datapointType,
        ...(co.bitLength !== undefined ? { bit_length: co.bitLength } : {}),
        ...(co.flags ? { flags: canonFlags(co.flags) } : {}),
        group_address_refs: (co.groupAddressRefs || []).map((ref) => ({
          role: ref.role,
          group_address_id: ref.groupAddressId,
        })),
      })),
    })),
    // Device-level com objects (if any)
    ...(dev.comObjects && dev.comObjects.length
      ? {
          com_objects: dev.comObjects.map((co) => ({
            id: co.id,
            name: co.name,
            number: co.number,
            dpt: co.datapointType,
            ...(co.bitLength !== undefined ? { bit_length: co.bitLength } : {}),
            ...(co.flags ? { flags: canonFlags(co.flags) } : {}),
            group_address_refs: (co.groupAddressRefs || []).map((ref) => ({
              role: ref.role,
              group_address_id: ref.groupAddressId,
            })),
          })),
        }
      : {}),
  }));

  // Indexes
  const indexes = {
    group_addresses_by_id: Object.fromEntries(
      Object.entries(catalog.indexes.groupAddressesById).map(([id, ga]) => [
        id,
        { address: ga.address, name: ga.name },
      ])
    ),
    com_objects_by_id: Object.fromEntries(
      Object.entries(catalog.indexes.comObjectsById).map(([id, co]) => [
        id,
        {
          device_id: co.deviceId,
          channel_id: co.channelId,
          dpt: co.datapointType,
        },
      ])
    ),
  };

  const stats = {
    totals: catalog.stats.totals,
    dpt_usage: catalog.stats.dptUsage,
    secure: {
      has_secure: catalog.stats.secure.hasSecure,
      secure_ga_count: catalog.stats.secure.secureGroupAddressCount,
    },
  };

  const out = { meta, topology, group_addresses, devices, indexes, stats };
  return YAML.stringify(out, { aliasDuplicateObjects: false });
}

export function toReportJson(catalog: KnxCatalog): string {
  return JSON.stringify(catalog.report, null, 2);
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
    scene: number;
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
    scene: ent.scenes.length,
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
      ent.scenes.length +
      ent.unknowns.length,
  };

  const byType: Record<string, number> = {};
  for (const s of ent.sensors) byType[s.type] = (byType[s.type] ?? 0) + 1;

  return { counts, sensorsByType: byType };
}
