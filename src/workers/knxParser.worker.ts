import { KnxCatalog } from "@/lib/types";
import { parseKnxproj, type ParseProgress } from "../lib/knx/parse";

type Req = { t: "parse"; file: File; concurrency?: number };
type Res =
  | { t: "progress"; p: ParseProgress }
  | { t: "result"; catalog: KnxCatalog }
  | { t: "error"; message: string };

self.onmessage = async (e: MessageEvent<Req>) => {
  const msg = e.data;
  if (msg.t === "parse") {
    try {
      const catalog = await parseKnxproj(msg.file, {
        concurrency: msg.concurrency ?? 4,
        onProgress: (p) =>
          (self as unknown as Worker).postMessage({ t: "progress", p } as Res),
      });
      (self as unknown as Worker).postMessage({ t: "result", catalog } as Res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Parse failed";
      (self as unknown as Worker).postMessage({ t: "error", message } as Res);
    }
  }
};

export {};
