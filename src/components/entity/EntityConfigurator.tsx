"use client";

import { useMemo, useState } from "react";

import {
  DOMAIN_BY_COLLECTION,
  EntityOverrides,
  KeyedEntities,
} from "./entity-config";
import {
  EntitySectionTable,
  buildRows,
  type SectionData,
  type EntityChangeHandler,
  type EntityResetHandler,
} from "./EntitySectionTable";

interface EntityConfiguratorProps {
  entities: KeyedEntities;
  overrides: EntityOverrides;
  onChange: EntityChangeHandler;
  onReset: EntityResetHandler;
}

const SECTION_LABEL: Record<keyof KeyedEntities, string> = {
  covers: "Covers",
  switches: "Switches",
  binarySensors: "Binary sensors",
  lights: "Lights",
  sensors: "Sensors",
  times: "Time",
  dates: "Date",
  datetimes: "Date & time",
  unknowns: "Unknown",
};

export default function EntityConfigurator({
  entities,
  overrides,
  onChange,
  onReset,
}: EntityConfiguratorProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sections = useMemo<SectionData[]>(() => {
    return (Object.keys(entities) as Array<keyof KeyedEntities>)
      .filter((key) => key !== "unknowns")
      .map((key) => {
        const domain = DOMAIN_BY_COLLECTION[key];
        return {
          key,
          domain,
          label: SECTION_LABEL[key],
          rows: buildRows(domain, entities[key], overrides),
        } satisfies SectionData;
      })
      .filter((section) => section.rows.length > 0);
  }, [entities, overrides]);

  if (!sections.length) return null;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Entity configuration</h3>
        <p className="text-xs text-muted-foreground">
          Adjust generated entities before downloading the YAML.
        </p>
      </div>
      {sections.map((section) => (
        <EntitySectionTable
          key={section.domain}
          section={section}
          onChange={onChange}
          onReset={onReset}
          collapsed={collapsed[section.domain] ?? true}
          onToggle={() =>
            setCollapsed((prev) => ({
              ...prev,
              [section.domain]: !(prev[section.domain] ?? true),
            }))
          }
        />
      ))}
    </div>
  );
}
