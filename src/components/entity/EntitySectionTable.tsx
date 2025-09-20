"use client";

import { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DomainEntityMap,
  EntityDomain,
  EntityOverride,
  EntityOverrides,
  KeyedEntities,
  entityPrimaryIdentifier,
  extractKeyIdentifier,
} from "./entity-config";
import { SENSOR_META } from "@/lib/knx/sensorMeta";

interface EntityTableRow {
  key: string;
  domain: EntityDomain;
  base: DomainEntityMap[EntityDomain];
  current: DomainEntityMap[EntityDomain];
  override?: EntityOverride;
  primary: string;
}

export type EntityChangeHandler = (
  domain: EntityDomain,
  key: string,
  base: DomainEntityMap[EntityDomain],
  patch: Partial<EntityOverride>
) => void;

export type EntityResetHandler = (key: string) => void;

function PrimaryCell({ value }: { value: string }) {
  if (!value) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return <code className="text-xs text-muted-foreground">{value}</code>;
}

interface AddressBadgeProps {
  label: string;
  value?: string | null;
  intent?: "normal" | "warning";
}

function AddressBadge({ label, value, intent = "normal" }: AddressBadgeProps) {
  if (!value) return null;
  const baseClass = "rounded px-1 py-[1px] text-[0.65rem] font-medium transition-colors";
  const visualClass =
    intent === "warning"
      ? "border border-destructive/60 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <code className={cn(baseClass, visualClass)}>
      {label}: {value}
    </code>
  );
}

function AddressBadgeList({ items }: { items: AddressBadgeProps[] }) {
  const visible = items.filter((item) => item.value);
  if (!visible.length) {
    return <span className="text-[0.7rem] text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item) => (
        <AddressBadge
          key={`${item.label}-${item.value}`}
          label={item.label}
          value={item.value}
          intent={item.intent ?? (item.label === "_unknown" ? "warning" : "normal")}
        />
      ))}
    </div>
  );
}

function SensorTypeCell({ type }: { type: string }) {
  const meta = SENSOR_META[type] ?? {};
  const Icon = meta.Icon;
  const unit = meta.unit;
  const isUnknown = type === "_unknown";

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      {Icon ? <Icon className="h-3 w-3 text-muted-foreground" /> : null}
      <code className={cn(isUnknown && "text-destructive")}>{type}</code>
      {unit ? <span className="text-muted-foreground">({unit})</span> : null}
    </span>
  );
}

export function buildRows(
  domain: EntityDomain,
  list: KeyedEntities[keyof KeyedEntities],
  overrides: EntityOverrides
): EntityTableRow[] {
  return list.map((item) => {
    const baseEntity = item.base as DomainEntityMap[typeof domain];
    const currentEntity = item.current as DomainEntityMap[typeof domain];
    const primary =
      entityPrimaryIdentifier(domain, baseEntity) ?? extractKeyIdentifier(item.key);

    return {
      key: item.key,
      domain,
      base: baseEntity,
      current: currentEntity,
      override: overrides[item.key],
      primary,
    };
  });
}

function createColumns(
  domain: EntityDomain,
  onChange: EntityChangeHandler,
  onReset: EntityResetHandler
): ColumnDef<EntityTableRow>[] {
  const columns: ColumnDef<EntityTableRow>[] = [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const { key, base, current, domain: rowDomain } = row.original;
        const overrideName = row.original.override?.name ?? "";
        return (
          <Input
            value={overrideName || current.name || ""}
            placeholder={base.name ?? "Custom name"}
            onChange={(event) =>
              onChange(rowDomain, key, base, {
                name: event.target.value,
              })
            }
          />
        );
      },
    },
    {
      accessorKey: "primary",
      header: "Primary GA",
      cell: ({ row }) => <PrimaryCell value={row.original.primary} />,
    },
  ];

  if (domain === "cover") {
    columns.push({
      id: "cover_commands",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">Commands</span>
          </TooltipTrigger>
          <TooltipContent>Open/close/stop addresses for the cover.</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["cover"];
        return (
          <AddressBadgeList
            items={[
              { label: "long", value: entity.move_long_address },
              { label: "short", value: entity.move_short_address },
              { label: "stop", value: entity.stop_address },
            ]}
          />
        );
      },
    });
    columns.push({
      id: "cover_position",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">Position</span>
          </TooltipTrigger>
          <TooltipContent>Command/state group addresses for slat position.</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["cover"];
        return (
          <AddressBadgeList
            items={[
              { label: "cmd", value: entity.position_address },
              { label: "state", value: entity.position_state_address },
            ]}
          />
        );
      },
    });
    columns.push({
      id: "cover_angle",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">Angle</span>
          </TooltipTrigger>
          <TooltipContent>Command/state group addresses for tilt angle.</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["cover"];
        return (
          <AddressBadgeList
            items={[
              { label: "cmd", value: entity.angle_address },
              { label: "state", value: entity.angle_state_address },
            ]}
          />
        );
      },
    });
    columns.push({
      id: "invert_position",
      header: () => (
        <div className="flex flex-col">
          <span>Invert position</span>
          <span className="text-xs text-muted-foreground">Reverse up/down commands</span>
        </div>
      ),
      cell: ({ row }) => {
        const { key } = row.original;
        const typedBase = row.original.base as DomainEntityMap["cover"];
        const typedCurrent = row.original.current as DomainEntityMap["cover"];
        return (
          <div className="flex items-center gap-2">
            <Switch
              className="cursor-pointer"
              checked={Boolean(typedCurrent.invert_position)}
              onCheckedChange={(checked) =>
                onChange("cover", key, typedBase, {
                  invert_position: checked,
                })
              }
              id={`${key}-invert-position`}
            />
            <Label htmlFor={`${key}-invert-position`} className="text-xs text-muted-foreground">
              Toggle
            </Label>
          </div>
        );
      },
    });
    columns.push({
      id: "invert_angle",
      header: () => (
        <div className="flex flex-col">
          <span>Invert angle</span>
          <span className="text-xs text-muted-foreground">Reverse tilt direction</span>
        </div>
      ),
      cell: ({ row }) => {
        const { key } = row.original;
        const typedBase = row.original.base as DomainEntityMap["cover"];
        const typedCurrent = row.original.current as DomainEntityMap["cover"];
        return (
          <div className="flex items-center gap-2">
            <Switch
              className="cursor-pointer"
              checked={Boolean(typedCurrent.invert_angle)}
              onCheckedChange={(checked) =>
                onChange("cover", key, typedBase, {
                  invert_angle: checked,
                })
              }
              id={`${key}-invert-angle`}
            />
            <Label htmlFor={`${key}-invert-angle`} className="text-xs text-muted-foreground">
              Toggle
            </Label>
          </div>
        );
      },
    });
  }

  if (domain === "switch") {
    columns.push({
      id: "switch_command",
      header: "Command",
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["switch"];
        return <PrimaryCell value={entity.address ?? ""} />;
      },
    });
    columns.push({
      id: "switch_state",
      header: "State",
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["switch"];
        return <PrimaryCell value={entity.state_address ?? ""} />;
      },
    });
    columns.push({
      id: "switch_respond",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">Respond</span>
          </TooltipTrigger>
          <TooltipContent>Indicates whether the switch replies to read requests.</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["switch"];
        return <span className="text-xs text-muted-foreground">{entity.respond_to_read ? "Yes" : "No"}</span>;
      },
    });
  }

  if (domain === "binary_sensor") {
    columns.push({
      id: "binary_state",
      header: "State",
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["binary_sensor"];
        return <PrimaryCell value={entity.state_address ?? ""} />;
      },
    });
  }

  if (domain === "time" || domain === "date" || domain === "datetime") {
    columns.push({
      id: `${domain}_state`,
      header: "State",
      cell: ({ row }) => {
        const entity = row.original.base as
          | DomainEntityMap["time"]
          | DomainEntityMap["date"]
          | DomainEntityMap["datetime"];
        return <PrimaryCell value={entity.state_address ?? ""} />;
      },
    });
  }

  if (domain === "light") {
    columns.push({
      id: "light_command",
      header: "Command",
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["light"];
        return <PrimaryCell value={entity.address ?? ""} />;
      },
    });
    columns.push({
      id: "light_state",
      header: "State",
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["light"];
        return <PrimaryCell value={entity.state_address ?? ""} />;
      },
    });
    columns.push({
      id: "light_brightness",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">Brightness</span>
          </TooltipTrigger>
          <TooltipContent>Dimming command group address (if available).</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["light"];
        return <PrimaryCell value={entity.brightness_address ?? ""} />;
      },
    });
  }

  if (domain === "scene") {
    columns.push({
      id: "scene_address",
      header: "Address",
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["scene"];
        return <PrimaryCell value={entity.address ?? ""} />;
      },
    });
  }

  if (domain === "sensor") {
    columns.push({
      id: "sensor_state",
      header: "State",
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["sensor"];
        return <PrimaryCell value={entity.state_address ?? ""} />;
      },
    });
    columns.push({
      id: "sensor_type",
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">Type</span>
          </TooltipTrigger>
          <TooltipContent>KNX sensor type (e.g. temperature, humidity).</TooltipContent>
        </Tooltip>
      ),
      cell: ({ row }) => {
        const entity = row.original.base as DomainEntityMap["sensor"];
        return <SensorTypeCell type={entity.type} />;
      },
    });
  }

  columns.push({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const { override, key } = row.original;
      if (!override) return null;
      return (
        <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => onReset(key)}>
          Reset
        </Button>
      );
    },
  });

  return columns;
}

export interface SectionData {
  key: keyof KeyedEntities;
  domain: EntityDomain;
  label: string;
  rows: EntityTableRow[];
}

interface EntitySectionTableProps {
  section: SectionData;
  onChange: EntityChangeHandler;
  onReset: EntityResetHandler;
  collapsed: boolean;
  onToggle: () => void;
}

export function EntitySectionTable({
  section,
  onChange,
  onReset,
  collapsed,
  onToggle,
}: EntitySectionTableProps) {
  const columns = useMemo(
    () => createColumns(section.domain, onChange, onReset),
    [section.domain, onChange, onReset]
  );

  const table = useReactTable({
    data: section.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="space-y-2">
      <div className="rounded-lg border border-border/60">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex w-full cursor-pointer items-center justify-between bg-muted/40 px-3 py-2 text-left"
        >
          <span className="text-sm font-semibold">{section.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {section.rows.length} {section.rows.length === 1 ? "entity" : "entities"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed ? "-rotate-90" : "rotate-0"
              )}
            />
          </div>
        </button>
        {!collapsed && (
          <div className="border-t border-border/60">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      <span className="text-xs text-muted-foreground">
                        No entities
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}
