"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function OptionsBar({
  file,
  busy,
  dropReserveFromUnknown,
  onToggleReserve,
  onParse,
  onReset,
}: {
  file: File | null;
  busy: boolean;
  dropReserveFromUnknown: boolean;
  onToggleReserve: (v: boolean) => void;
  onParse: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <Label className="mb-1 block text-xs text-muted-foreground">
          Selected file
        </Label>
        <div className="truncate text-sm">
          {file ? (
            <Badge variant="secondary" className="max-w-full truncate">
              {file.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">No file selected</span>
          )}
        </div>
      </div>

      <div className="inline-flex h-9 items-center gap-3">
        <div className="inline-flex items-center gap-2">
          <Switch
            id="opt-reserve"
            checked={dropReserveFromUnknown}
            onCheckedChange={onToggleReserve}
            disabled={busy}
          />
          <Label
            htmlFor="opt-reserve"
            className="cursor-pointer text-sm leading-none"
          >
            Filter <code>Reserve</code> from <code>_unknown</code>
          </Label>
        </div>
      </div>

      <div className="flex gap-2 md:justify-end">
        <Button
          onClick={onParse}
          className="cursor-pointer"
          disabled={!file || busy}
        >
          {busy ? "Busy…" : "Parse file"}
        </Button>
        <Button
          onClick={onReset}
          className="cursor-pointer"
          disabled={busy && !file}
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
