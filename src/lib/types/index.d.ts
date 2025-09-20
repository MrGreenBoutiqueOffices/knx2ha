export interface GroupAddress {
  id: string;
  name: string;
  address: string;
  description?: string;
  dpt?: string;
}

export interface KnxCatalog {
  project_name?: string | null;
  group_addresses: GroupAddress[];
  links?: KnxLinkInfo[];
}

export type HAType =
  | "switch"
  | "binary_sensor"
  | "light"
  | "sensor"
  | "cover"
  | "time"
  | "date"
  | "datetime"
  | "scene"
  | "unknown";

export interface HaSwitch {
  name?: string;
  address: string;
  state_address?: string;
  invert?: boolean;
  respond_to_read?: boolean;
  entity_category?: string;
  device_class?: string;
}

export interface HaBinarySensor {
  name?: string;
  state_address: string;
  device_class?: string;
  entity_category?: string;
}

export interface HaLight {
  name?: string;
  address: string;
  state_address?: string;
  brightness_address?: string;
  brightness_state_address?: string;
}

export interface HaSensor {
  name?: string;
  state_address: string;
  type: string;
}

export interface HaTime {
  name?: string;
  address: string;
  state_address?: string;
  respond_to_read?: boolean;
  sync_state?: boolean | string | number;
  entity_category?: string;
}

export interface HaDate {
  name?: string;
  address: string;
  state_address?: string;
  respond_to_read?: boolean;
  sync_state?: boolean | string | number;
  entity_category?: string;
}

export interface HaDateTime {
  name?: string;
  address: string;
  state_address?: string;
  respond_to_read?: boolean;
  sync_state?: boolean | string | number;
  entity_category?: string;
}

export interface HaCover {
  name?: string;
  move_long_address?: string;
  move_short_address?: string;
  stop_address?: string;
  position_address?: string;
  position_state_address?: string;
  angle_address?: string;
  angle_state_address?: string;
  invert_position?: boolean;
  invert_angle?: boolean;
  travelling_time_up?: number;
  travelling_time_down?: number;
}

export interface HaScene {
  name?: string;
  address: string;
  scene_number?: number;
}

export interface UnknownEntity {
  name: string;
  address: string;
  dpt?: string;
}

export type MappedEntity =
  | { domain: "switch"; payload: HaSwitch }
  | { domain: "binary_sensor"; payload: HaBinarySensor }
  | { domain: "light"; payload: HaLight }
  | { domain: "sensor"; payload: HaSensor }
  | { domain: "time"; payload: HaTime }
  | { domain: "date"; payload: HaDate }
  | { domain: "datetime"; payload: HaDateTime }
  | { domain: "cover"; payload: HaCover }
  | { domain: "scene"; payload: HaScene }
  | { domain: "_unknown"; payload: UnknownEntity };

export interface ExportOptions {
  dropReserveFromUnknown?: boolean;
}

export interface LightAggregate {
  name: string;
  on_off?: string;
  on_off_state?: string;
  brightness?: string;
  brightness_state?: string;
  dimming?: string;
  consumedIds: Set<string>;
}

export interface KnxLinkInfo {
  gaId: string;
  context?: string;
  comObject?: string;
  dpt?: string;
  flags?: Record<string, boolean | string>;
}
