"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LABEL } from "./constants";
import { HaDomain } from "@/lib/knx/export";

type Counts = Record<HaDomain, number>;

type Props = {
  prefix: string;
  setPrefix: (v: string) => void;
  availableDomains: HaDomain[];
  counts: Counts;
  selected: Set<HaDomain>;
  toggle: (d: HaDomain) => void;
  setAll: (on: boolean) => void;
  selectedDomains: HaDomain[];
  selectedEntityCount: number;
};

export default function ExportOptions({
  prefix,
  setPrefix,
  availableDomains,
  counts,
  selected,
  toggle,
  setAll,
  selectedDomains,
  selectedEntityCount,
}: Props) {
  return (
    <>
      <div className="mt-3">
        <label className="mb-1 block text-sm font-medium">Filename prefix</label>
        <Input
          value={prefix}
          onChange={(e) => setPrefix(e.target.value.replace(/[^a-z0-9_-]+/gi, "_"))}
          placeholder="project_name"
        />
      </div>

      <Separator className="my-3" />

      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">Entity types</span>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-8 px-2" onClick={() => setAll(true)}>
            Select all
          </Button>
          <Button variant="ghost" className="h-8 px-2" onClick={() => setAll(false)}>
            Select none
          </Button>
        </div>
      </div>

      <fieldset className="rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Types</legend>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {availableDomains
            .filter((d) => d !== "_unknown")
            .map((d) => (
              <label key={d} className="flex items-center gap-3 leading-tight">
                <input
                  type="checkbox"
                  className="accent-primary h-4 w-4"
                  checked={selected.has(d)}
                  onChange={() => toggle(d)}
                />
                <span className="flex-1">
                  {LABEL[d]}
                  <span className="ml-2 text-xs text-muted-foreground">({counts[d]})</span>
                </span>
              </label>
            ))}
        </div>
      </fieldset>

      <div className="mt-2 text-xs text-muted-foreground">
        Selected: {selectedDomains.length} type(s) • {selectedEntityCount} entities
      </div>
    </>
  );
}
