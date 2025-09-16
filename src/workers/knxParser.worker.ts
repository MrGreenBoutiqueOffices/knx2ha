import { parseKnxproj } from "../lib/knx/parse";
import type { KnxCatalog } from "../lib/knx/types";

type Req = { t: "parse"; file: File };

type Res =
  | { t: "progress"; value: number }
  | { t: "result"; catalog: KnxCatalog }
  | { t: "error"; message: string };

self.onmessage = async (e: MessageEvent<Req>) => {
  const msg = e.data;

  if (msg.t === "parse") {
    try {
      (self as unknown as Worker).postMessage({
        t: "progress",
        value: 10,
      } satisfies Res);
      const catalog = await parseKnxproj(msg.file);
      (self as unknown as Worker).postMessage({
        t: "progress",
        value: 95,
      } satisfies Res);
      (self as unknown as Worker).postMessage({
        t: "result",
        catalog,
      } satisfies Res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Parse failed";
      (self as unknown as Worker).postMessage({
        t: "error",
        message,
      } satisfies Res);
    }
  }
};

export {};
