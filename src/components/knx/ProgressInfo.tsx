"use client";

import { Progress } from "@/components/ui/progress";
import { Bug } from "lucide-react";
import type { ParseProgress } from "@/lib/types/parse";

function basename(path?: string) {
  if (!path) return "";
  const idx = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return idx >= 0 ? path.slice(idx + 1) : path;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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

  const totalFiles = info?.totalFiles;
  const processedFiles = info?.processedFiles;
  const resolvedProcessedFiles = isFiniteNumber(processedFiles)
    ? processedFiles
    : 0;
  const filesLabel =
    isFiniteNumber(totalFiles) && totalFiles > 0
      ? `files ${Math.min(resolvedProcessedFiles, totalFiles)}/${totalFiles}`
      : null;

  const foundGAs = info?.foundGAs;
  const processedGAs = info?.processedGAs;

  const gaLabel = (() => {
    const preferProcessed =
      info?.phase === "build_catalog" || info?.phase === "done";
    if (preferProcessed && isFiniteNumber(processedGAs)) {
      return `GA ${processedGAs}`;
    }
    if (isFiniteNumber(foundGAs)) {
      return `GA ${foundGAs}`;
    }
    if (isFiniteNumber(processedGAs)) {
      return `GA ${processedGAs}`;
    }
    return null;
  })();

  const detailParts = [filesLabel, gaLabel].filter(Boolean);
  const detailSuffix = detailParts.length ? ` — ${detailParts.join(", ")}` : "";

  const statusMessage = info?.phase === "load_zip" ? (
    "Loading ZIP archive..."
  ) : info?.phase === "scan_entries" ? (
    `Scanning entries${detailSuffix}`
  ) : info?.phase === "extract_xml" && info.filename ? (
    `Reading ${basename(info.filename)} (${(info.filePercent ?? 0).toFixed(0)}%)${detailSuffix}`
  ) : info?.phase === "parse_xml" && info.filename ? (
    `Parsing ${basename(info.filename)}${detailSuffix}`
  ) : info?.phase === "build_catalog" ? (
    `Building catalog${detailSuffix}`
  ) : info?.phase === "done" ? (
    `Completed${detailSuffix}`
  ) : (
    "Processing..."
  );

  return (
    <>
      {busy && (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4" aria-live="polite">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{statusMessage}</span>
              <span className="tabular-nums font-mono text-xs text-muted-foreground">
                {pct}%
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>

          {/* Details */}
          {detailParts.length > 0 && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {filesLabel && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{filesLabel}</span>
                </div>
              )}
              {gaLabel && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{gaLabel}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex gap-3">
            <div className="shrink-0 rounded-md bg-destructive/20 p-2">
              <Bug className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-1 text-sm font-semibold text-destructive">An error occurred</h4>
              <p className="wrap-break-word text-xs text-destructive/90">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
