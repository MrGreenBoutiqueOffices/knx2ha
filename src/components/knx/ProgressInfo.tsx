"use client";

import { Progress } from "@/components/ui/progress";
import { Bug } from "lucide-react";
import type { ParseProgress } from "@/lib/knx/parse";

export default function ProgressInfo({
  busy,
  progress,
  info,
  error,
}: {
  busy: boolean;
  progress: number;
  info: ParseProgress | null;
  error: string | null;
}) {
  return (
    <>
      {busy && (
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-2 w-full" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {info?.phase === "extract_xml" && info.filename ? (
              <>
                Lezen: <code>{info.filename.split("/").pop()}</code> (
                {(info.filePercent ?? 0).toFixed(0)}%) —{" "}
                {info.processedFiles ?? 0}/{info.totalFiles ?? 0}
              </>
            ) : info?.phase === "parse_xml" && info.filename ? (
              <>
                Parsen: <code>{info.filename.split("/").pop()}</code> —{" "}
                {info.processedFiles ?? 0}/{info.totalFiles ?? 0}
              </>
            ) : info?.phase === "scan_entries" ? (
              <>Bestanden inventariseren…</>
            ) : info?.phase === "build_catalog" ? (
              <>Catalog samenstellen…</>
            ) : (
              <>Bezig…</>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <Bug className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}
    </>
  );
}
