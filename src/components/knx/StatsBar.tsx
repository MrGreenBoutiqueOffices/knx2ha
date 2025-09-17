"use client";

import { Badge } from "@/components/ui/badge";
import type { EntitySummary } from "@/lib/knx/export";

const SENSOR_UNITS: Record<string, string> = {
  temperature: "°C",
  illuminance: "lx",
  humidity: "%RH",
  ppm: "ppm",
  voltage: "V",
  curr: "A",
  pressure_2byte: "hPa",
  power_2byte: "W",
  wind_speed_ms: "m/s",
  wind_speed_kmh: "km/h",
  rain_amount: "mm",
  volume_flow: "m³/h",
  percent: "%",
  brightness: "lx",
};

function unitFor(type: string): string | undefined {
  return SENSOR_UNITS[type];
}

export default function StatsBar({ summary }: { summary: EntitySummary }) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">switch: {summary.counts.switch}</Badge>
        <Badge variant="outline">light: {summary.counts.light}</Badge>
        <Badge variant="outline">
          binary_sensor: {summary.counts.binary_sensor}
        </Badge>
        <Badge variant="outline">sensor: {summary.counts.sensor}</Badge>
        <Badge variant="outline">cover: {summary.counts.cover}</Badge>
        {summary.counts._unknown > 0 && (
          <Badge variant="destructive">
            _unknown: {summary.counts._unknown}
          </Badge>
        )}
        <span className="ms-auto text-xs text-muted-foreground">
          Total: {summary.counts.total}
        </span>
      </div>

      {Object.keys(summary.sensorsByType).length > 0 && (
        <div className="mb-3 text-xs text-muted-foreground">
          Sensor types:&nbsp;
          {Object.entries(summary.sensorsByType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([t, n]) => (
              <span key={t} className="me-3">
                <code>{t}</code>
                {unitFor(t) ? (
                  <>
                    {" "}
                    (<span>{unitFor(t)}</span>)
                  </>
                ) : null}{" "}
                × {n}
              </span>
            ))}
        </div>
      )}
    </>
  );
}
