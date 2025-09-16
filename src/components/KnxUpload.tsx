"use client";

import { useMemo, useState } from "react";
import type { KnxCatalog } from "@/lib/knx/types";
import { parseKnxproj } from "@/lib/knx/parse";
import { toCatalogYaml, toHomeAssistantYaml } from "@/lib/knx/export";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function KnxUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<KnxCatalog | null>(null);

  // Opties
  const [dropReserveFromUnknown, setDropReserveFromUnknown] = useState(true);
  const [debug, setDebug] = useState(false);

  const catalogYaml = useMemo(
    () => (catalog ? toCatalogYaml(catalog) : ""),
    [catalog]
  );

  const haYaml = useMemo(
    () =>
      catalog ? toHomeAssistantYaml(catalog, { dropReserveFromUnknown }) : "",
    [catalog, dropReserveFromUnknown]
  );

  async function handleParse() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const cat = await parseKnxproj(file, { debug });
      setCatalog(cat);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Kon het bestand niet parsen.");
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setFile(null);
    setCatalog(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-3">
        KNX → Home Assistant (client-side)
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        Upload <code>.knxproj</code>. Alles gebeurt lokaal in je browser (ZIP →
        XML → YAML).
      </p>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
        <input
          type="file"
          accept=".knxproj,application/zip"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dropReserveFromUnknown}
              onChange={(e) => setDropReserveFromUnknown(e.target.checked)}
            />
            <span>
              Filter <code>Reserve</code> uit <code>_unknown</code>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
            />
            <span>Debug console</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleParse}
            disabled={!file || busy}
            className="rounded-md border px-3 py-1 disabled:opacity-50"
          >
            {busy ? "Bezig…" : "Parsen"}
          </button>
          <button
            onClick={handleReset}
            disabled={busy && !catalog}
            className="rounded-md border px-3 py-1 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
          {error}
        </div>
      )}

      {catalog && (
        <>
          <div className="mb-3 text-sm text-gray-700">
            Project: <b>{catalog.project_name ?? "Onbekend"}</b> —{" "}
            {catalog.group_addresses.length} group addresses
          </div>

          <div className="mb-2 flex gap-2">
            <button
              onClick={() => downloadText("knx_catalog.yaml", catalogYaml)}
              className="rounded-md border px-3 py-1"
            >
              Download catalog YAML
            </button>
            <button
              onClick={() => downloadText("knx_homeassistant.yaml", haYaml)}
              className="rounded-md border px-3 py-1"
            >
              Download Home Assistant YAML
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-medium mb-2">Catalog YAML</h2>
              <pre className="h-96 overflow-auto rounded-md border bg-gray-50 p-3 text-xs">
                {catalogYaml}
              </pre>
            </div>
            <div>
              <h2 className="font-medium mb-2">
                Home Assistant YAML (voorstel)
              </h2>
              <pre className="h-96 overflow-auto rounded-md border bg-gray-50 p-3 text-xs">
                {haYaml}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
