export type ParsePhase =
  | "load_zip"
  | "scan_entries"
  | "extract_xml"
  | "parse_xml"
  | "build_catalog"
  | "done";

export interface ParseProgress {
  phase: ParsePhase;
  percent: number;
  totalFiles?: number;
  processedFiles?: number;
  filename?: string;
  filePercent?: number;
}

export interface ParseOptions {
  debug?: boolean;
  onProgress?: (p: ParseProgress) => void;
  concurrency?: number;
  addressCache?: "retain" | "clear_before" | "clear_after";
}
