"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Play,
  FileCode,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      {file && (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
          <div className="rounded-md bg-primary/10 p-2">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Selected file</p>
            <p className="truncate text-sm font-semibold">{file.name}</p>
          </div>
          <Badge variant="secondary">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </Badge>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border bg-background p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <Label htmlFor="opt-reserve" className="cursor-pointer text-sm font-medium">
              Filter reserve entities
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Hide entities marked as &quot;Reserve&quot;
            </p>
          </div>
        </div>
        <Switch
          id="opt-reserve"
          checked={dropReserveFromUnknown}
          onCheckedChange={onToggleReserve}
          disabled={busy}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onParse}
          disabled={!file || busy}
          size="lg"
          className={cn("w-full", busy && "cursor-wait")}
        >
          {busy ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Working...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Parse
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="w-full" disabled={busy}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onImportConfig} disabled={busy}>
              <UploadIcon className="mr-2 h-4 w-4" />
              <span>Import config</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExportConfig} disabled={!canExport || busy}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              <span>Export config</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onReset} disabled={busy} className="text-destructive">
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Reset all</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
