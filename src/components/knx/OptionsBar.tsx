"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshCw, Upload as UploadIcon, Download as DownloadIcon, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function OptionsBar({
  file,
  busy,
  dropReserveFromUnknown,
  onToggleReserve,
  onParse,
  onReset,
  onImportConfig,
  onExportConfig,
  canExport,
}: {
  file: File | null;
  busy: boolean;
  dropReserveFromUnknown: boolean;
  onToggleReserve: (v: boolean) => void;
  onParse: () => void;
  onReset: () => void;
  onImportConfig: () => void;
  onExportConfig: () => void;
  canExport: boolean;
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
          <Label htmlFor="opt-reserve" className="cursor-pointer text-sm leading-none">
            Filter <code>Reserve</code> entities
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More actions"
              className="cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onImportConfig} disabled={busy}>
              <UploadIcon className="h-4 w-4" />
              Import config
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExportConfig} disabled={!canExport || busy}>
              <DownloadIcon className="h-4 w-4" />
              Export config
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onReset} disabled={busy}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
