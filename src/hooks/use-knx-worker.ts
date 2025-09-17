"use client";

import { useCallback, useState } from "react";
import { parseKnxproj, type ParseProgress } from "@/lib/knx/parse";
import { KnxCatalog } from "@/lib/types";

export function useKnxWorker() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressInfo, setProgressInfo] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(
    async (file: File): Promise<KnxCatalog> => {
      if (busy) throw new Error("Parser is already working.");
      setBusy(true);
      setError(null);
      setProgress(0);
      setProgressInfo({ phase: "load_zip", percent: 0 });

      try {
        const catalog = await parseKnxproj(file, {
          onProgress: (p) => {
            setProgress(p.percent);
            setProgressInfo(p);
          },
        });
        setProgress(100);
        setBusy(false);
        return catalog;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not parse the file.";
        setError(msg);
        setBusy(false);
        throw new Error(msg);
      }
    },
    [busy]
  );

  return { parse, busy, progress, progressInfo, error };
}
