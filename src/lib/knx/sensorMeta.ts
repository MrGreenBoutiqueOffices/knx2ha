import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  Droplets,
  Gauge,
  SunMedium,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

export type SensorMeta = {
  unit?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export const SENSOR_META: Record<string, SensorMeta> = {
  temperature: { unit: "°C", Icon: Thermometer },
  illuminance: { unit: "lx", Icon: SunMedium },
  humidity: { unit: "%", Icon: Droplets },
  ppm: { unit: "ppm", Icon: Gauge },
  voltage: { unit: "V", Icon: Zap },
  curr: { unit: "A", Icon: Activity },
  pressure_2byte: { unit: "hPa", Icon: Gauge },
  power_2byte: { unit: "W", Icon: Zap },
  wind_speed_ms: { unit: "m/s", Icon: Wind },
  wind_speed_kmh: { unit: "km/h", Icon: Wind },
  rain_amount: { unit: "mm", Icon: Waves },
  volume_flow: { unit: "m³/h", Icon: Waves },
  percent: { unit: "%", Icon: Gauge },
  brightness: { unit: "lx", Icon: SunMedium },
};
