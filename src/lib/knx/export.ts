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
  collectConsumedIds,
  mapSingleGaToEntity,
} from "./aggregate";

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

export function toHomeAssistantYaml(
  catalog: KnxCatalog,
  opts: ExportOptions = {}
): string {
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
    else {
      entry.respond_to_read = true;
    }
    switches.push(entry);
  }

  const consumed = collectConsumedIds(laAggs, switchAggs);
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

  const knx: Record<string, unknown> = {};
  if (switches.length) knx["switch"] = switches;
  if (binarySensors.length) knx["binary_sensor"] = binarySensors;
  if (lights.length) knx["light"] = lights;
  if (sensors.length) knx["sensor"] = sensors;
  if (covers.length) knx["cover"] = covers;
  if (finalUnknowns.length) knx["_unknown"] = finalUnknowns;

  return YAML.stringify({ knx }, { aliasDuplicateObjects: false });
}
