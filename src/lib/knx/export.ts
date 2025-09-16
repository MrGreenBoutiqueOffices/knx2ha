import YAML from "yaml";
import { ExportOptions, KnxCatalog } from "./types";
import {
  buildLaLightAggregates,
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
  const switches: Array<Record<string, unknown>> = [];
  const binarySensors: Array<Record<string, unknown>> = [];
  const lights: Array<Record<string, unknown>> = [];
  const sensors: Array<Record<string, unknown>> = [];
  const covers: Array<Record<string, unknown>> = [];
  const unknowns: Array<Record<string, unknown>> = [];

  // 1) LA-aggregatie
  const laAggs = buildLaLightAggregates(catalog.group_addresses);
  const consumed = collectConsumedIds(laAggs);

  for (const a of laAggs) {
    const entry: Record<string, unknown> = { name: a.name };
    if (a.on_off) entry["address"] = a.on_off;
    if (a.on_off_state) entry["state_address"] = a.on_off_state;
    if (a.brightness) entry["brightness_address"] = a.brightness;
    if (a.brightness_state)
      entry["brightness_state_address"] = a.brightness_state;
    lights.push(entry);
  }

  // 2) Rest mappen met heuristiek
  for (const ga of catalog.group_addresses) {
    if (consumed.has(ga.id)) continue;
    const { domain, payload } = mapSingleGaToEntity(ga);
    if (domain === "switch") switches.push(payload);
    else if (domain === "binary_sensor") binarySensors.push(payload);
    else if (domain === "light") lights.push(payload);
    else if (domain === "sensor") sensors.push(payload);
    else if (domain === "cover") covers.push(payload);
    else unknowns.push(payload);
  }

  // 3) Unknowns opschonen (optioneel): verwijder items met name === "Reserve"
  const finalUnknowns = opts.dropReserveFromUnknown
    ? unknowns.filter((x) => String(x.name).trim().toLowerCase() !== "reserve")
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
