"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshCw, Play, FileCode, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

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

      <div className="space-y-3">
        <Button
          onClick={onParse}
          disabled={!file || busy}
          size="lg"
          className={cn("w-full", busy && "cursor-wait")}
        >
          {busy ? (
            <>
              <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
              Working...
            </>
          ) : (
            <>
              <Play className="mr-1 h-4 w-4" />
              Parse
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Snapshot controls live in the header so you can import/export from any step.
        </p>
      </div>
    </div>
  );
}
