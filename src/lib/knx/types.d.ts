export interface GroupAddress {
  id: string;
  name: string;
  address: string; // "x/y/z"
  description?: string;
  dpt?: string;
}

export interface KnxCatalog {
  project_name?: string | null;
  group_addresses: GroupAddress[];
}

export type HAType =
  | "switch"
  | "binary_sensor"
  | "light"
  | "sensor"
  | "cover"
  | "unknown";

export interface LightAggregate {
  name: string;
  on_off?: string; // 1/1/x (DPST-1-1)
  on_off_state?: string; // 1/5/x (DPST-1-1)
  brightness?: string; // 1/3/x (DPST-5-1)
  brightness_state?: string; // 1/4/x (DPST-5-1)
  dimming?: string; // 1/2/x (DPST-3-7)
  consumedIds: Set<string>;
}

export interface ExportOptions {
  dropReserveFromUnknown?: boolean;
}
