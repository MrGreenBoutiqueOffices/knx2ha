"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KnxCatalog } from "@/lib/knx/types";

type WorkerRes =
  | { t: "progress"; value: number }
  | { t: "result"; catalog: KnxCatalog }
  | { t: "error"; message: string };

export function useKnxWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const parse = useCallback((file: File) => {
    return new Promise<KnxCatalog>((resolve, reject) => {
      const w = workerRef.current;
      if (!w) {
        reject(new Error("Worker not ready"));
        return;
      }
      setBusy(true);
      setError(null);
      setProgress(0);

      const onMessage = (e: MessageEvent<WorkerRes>) => {
        const data = e.data;
        if (data.t === "progress") setProgress(data.value);
        if (data.t === "result") {
          setProgress(100);
          setBusy(false);
          w.removeEventListener("message", onMessage);
          resolve(data.catalog);
        }
        if (data.t === "error") {
          setBusy(false);
          setError(data.message);
          w.removeEventListener("message", onMessage);
          reject(new Error(data.message));
        }
      };

      w.addEventListener("message", onMessage);
      w.postMessage({ t: "parse", file });
    });
  }, []);

  return { parse, busy, progress, error };
}
