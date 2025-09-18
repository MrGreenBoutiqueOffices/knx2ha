import { KnxCatalog } from "@/lib/types";
import { parseKnxproj } from "@/lib/knx/parse";
import { ParseProgress } from "@/lib/types/parse";

type Req = { t: "parse"; file: File };
type Res =
  | { t: "progress"; p: ParseProgress }
  | { t: "result"; catalog: KnxCatalog }
  | { t: "error"; message: string };

self.onmessage = async (e: MessageEvent<Req>) => {
  const msg = e.data;
  if (msg.t !== "parse") return;

  try {
    const catalog = await parseKnxproj(msg.file, {
      onProgress: (p) =>
        (self as unknown as Worker).postMessage({ t: "progress", p } as Res),
    });
    (self as unknown as Worker).postMessage({ t: "result", catalog } as Res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    (self as unknown as Worker).postMessage({ t: "error", message } as Res);
  }
};

export {};
