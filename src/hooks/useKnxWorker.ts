"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ParseProgress } from "@/lib/knx/parse";
import { KnxCatalog } from "@/lib/types";

type WorkerRes =
  | { t: "progress"; p: ParseProgress }
  | { t: "result"; catalog: KnxCatalog }
  | { t: "error"; message: string };

export function useKnxWorker(concurrency = 4) {
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressInfo, setProgressInfo] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const w = new Worker(
      new URL("../workers/knxParser.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = w;
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  const parse = useCallback(
    (file: File) => {
      return new Promise<KnxCatalog>((resolve, reject) => {
        const w = workerRef.current;
        if (!w) {
          reject(new Error("Worker not ready"));
          return;
        }
        setBusy(true);
        setError(null);
        setProgress(0);
        setProgressInfo(null);

        const onMessage = (e: MessageEvent<WorkerRes>) => {
          const data = e.data;
          if (data.t === "progress") {
            setProgress(data.p.percent);
            setProgressInfo(data.p);
          } else if (data.t === "result") {
            setBusy(false);
            w.removeEventListener("message", onMessage);
            resolve(data.catalog);
          } else if (data.t === "error") {
            setBusy(false);
            setError(data.message);
            w.removeEventListener("message", onMessage);
            reject(new Error(data.message));
          }
        };

        w.addEventListener("message", onMessage);
        w.postMessage({ t: "parse", file, concurrency });
      });
    },
    [concurrency]
  );

  return { parse, busy, progress, progressInfo, error };
}
