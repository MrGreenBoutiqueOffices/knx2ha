import type { KnxCatalog, KnxGroupAddress } from "@/lib/types";

// Keep this detached from UI component types to avoid circular deps
export type SavedEntityOverride = {
  name?: string;
  invert_position?: boolean;
  invert_angle?: boolean;
};

export type SavedEntityOverrides = Record<string, SavedEntityOverride>;

export interface SavedConfigV1 {
  version: 1;
  tool: "knx2ha";
  savedAt: string; // ISO string
  project?: string;
  options: {
    dropReserveFromUnknown: boolean;
  };
  catalog: KnxCatalog; // Full parsed catalog snapshot
  overrides: SavedEntityOverrides;
}

export type SavedConfig = SavedConfigV1; // Future: union for migrations

export function buildSavedConfig(input: {
  catalog: KnxCatalog;
  overrides: SavedEntityOverrides;
  dropReserveFromUnknown: boolean;
}): SavedConfigV1 {
  const { catalog, overrides, dropReserveFromUnknown } = input;
  return {
    version: 1,
    tool: "knx2ha",
    savedAt: new Date().toISOString(),
    project: catalog?.meta?.name ?? "Unknown",
    options: { dropReserveFromUnknown: Boolean(dropReserveFromUnknown) },
    catalog,
    overrides: overrides ?? {},
  } satisfies SavedConfigV1;
}

export function stringifySavedConfig(cfg: SavedConfig): string {
  // Pretty-print for readability when sharing
  return JSON.stringify(cfg, null, 2);
}

export function parseSavedConfig(text: string): SavedConfig {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== "object") throw new Error("Invalid config file");
  if (raw.version !== 1 || raw.tool !== "knx2ha")
    throw new Error("Unsupported or unknown config format");

  // Light validation of essential fields
  if (!raw.catalog || !raw.catalog.meta || !raw.catalog.groupAddresses)
    throw new Error("Config file is missing catalog data");

  // Ensure presence of auxiliary legacy compat fields used in UI, if missing
  if (!Array.isArray(raw.catalog.group_addresses)) {
    // Build a minimal legacy list to avoid UI fallbacks breaking
    const flat: KnxGroupAddress[] = Array.isArray(raw.catalog.groupAddresses?.flat)
      ? (raw.catalog.groupAddresses.flat as KnxGroupAddress[])
      : [];
    raw.catalog.group_addresses = flat.map((ga) => ({
      id: String(ga.id),
      name: ga.name,
      address: ga.address,
      dpt: ga.datapointType,
      description: ga.description,
    }));
  }

  // Normalize overrides shape
  const overrides = raw.overrides && typeof raw.overrides === "object" ? raw.overrides : {};

  const options = raw.options || { dropReserveFromUnknown: true };

  const out: SavedConfigV1 = {
    version: 1,
    tool: "knx2ha",
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date().toISOString(),
    project: raw.project ?? raw.catalog?.meta?.name ?? "Unknown",
    options: { dropReserveFromUnknown: Boolean(options.dropReserveFromUnknown) },
    catalog: raw.catalog,
    overrides,
  };
  return out;
}
