"use client";

import { Badge } from "@/components/ui/badge";
import type { EntitySummary } from "@/lib/knx/export";
import { SENSOR_META } from "@/lib/knx/sensorMeta";

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
        <Badge variant="outline">time: {summary.counts.time}</Badge>
        <Badge variant="outline">date: {summary.counts.date}</Badge>
        <Badge variant="outline">datetime: {summary.counts.datetime}</Badge>
        <Badge variant="outline">cover: {summary.counts.cover}</Badge>
        <Badge variant="outline">scene: {summary.counts.scene}</Badge>
        {summary.counts._unknown > 0 && (
          <Badge
            variant="outline"
            className="border-destructive text-destructive"
          >
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
            .map(([type, count]) => {
              const meta = SENSOR_META[type] ?? {};
              const Icon = meta.Icon;
              return (
                <span key={type} className="me-4 inline-flex items-center gap-1">
                  {Icon ? (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : null}
                  <code>{type}</code>
                  {meta.unit ? (
                    <span className="text-muted-foreground">({meta.unit})</span>
                  ) : null}
                  × {count}
                </span>
              );
            })}
        </div>
      )}
    </>
  );
}
