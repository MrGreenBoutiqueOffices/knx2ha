"use client";

import { Progress } from "@/components/ui/progress";
import { Bug } from "lucide-react";
import type { ParseProgress } from "@/lib/knx/parse";

function basename(path?: string) {
  if (!path) return "";
  const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return idx >= 0 ? path.slice(idx + 1) : path;
}

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
  const pct = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : 0;

  return (
    <>
      {busy && (
        <div className="space-y-1" aria-live="polite">
          <div className="flex items-center gap-3">
            <Progress value={pct} className="h-2 w-full" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {pct}%
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {info?.phase === "load_zip" ? (
              <>Loading zip…</>
            ) : info?.phase === "scan_entries" ? (
              <>Scanning entries…</>
            ) : info?.phase === "extract_xml" && info.filename ? (
              <>
                Reading: <code>{basename(info.filename)}</code> (
                {(info.filePercent ?? 0).toFixed(0)}%) —{" "}
                {info.processedFiles ?? 0}/{info.totalFiles ?? 0}
              </>
            ) : info?.phase === "parse_xml" && info.filename ? (
              <>
                Parsing: <code>{basename(info.filename)}</code> —{" "}
                {info.processedFiles ?? 0}/{info.totalFiles ?? 0}
              </>
            ) : info?.phase === "build_catalog" ? (
              <>Building catalog…</>
            ) : info?.phase === "done" ? (
              <>Done.</>
            ) : (
              <>Working…</>
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
