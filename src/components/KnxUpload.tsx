"use client";

import { useMemo, useRef, useState } from "react";
import type { KnxCatalog } from "@/lib/knx/types";
import { toCatalogYaml, toHomeAssistantYaml } from "@/lib/knx/export";
import { useKnxWorker } from "@/hooks/useKnxWorker";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import {
  UploadCloud,
  FileDown,
  RefreshCw,
  Bug,
  Copy,
  Check,
  PackageOpen,
} from "lucide-react";

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
  const { parse, busy, progress, error: workerError } = useKnxWorker();

  const [file, setFile] = useState<File | null>(null);
  const [catalog, setCatalog] = useState<KnxCatalog | null>(null);

  // optie
  const [dropReserveFromUnknown, setDropReserveFromUnknown] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

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
    try {
      const cat = await parse(file);
      setCatalog(cat);
      toast.success("Gereed", {
        description: `${cat.group_addresses.length} group addresses gevonden.`,
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Kon het bestand niet parsen.";
      toast.error("Fout bij parsen", { description: msg });
    }
  }

  function handleReset() {
    setFile(null);
    setCatalog(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    if (e.currentTarget === dropRef.current) setIsDragging(false);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Gekopieerd", {
        description: "YAML is naar het klembord gekopieerd.",
      });
      return true;
    } catch {
      toast.error("Kopiëren mislukt", {
        description: "Kon de tekst niet kopiëren.",
      });
      return false;
    }
  }

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl p-6">
        {/* header */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-muted p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <PackageOpen className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold tracking-tight">
                  KNX → Home Assistant
                </h1>
              </div>
              <div className="ms-auto flex items-center gap-2">
                {catalog && (
                  <Badge variant="secondary">
                    {catalog.project_name ?? "Onbekend"}
                  </Badge>
                )}
                {catalog && (
                  <Badge variant="outline">
                    {catalog.group_addresses.length} GA&apos;s
                  </Badge>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Parseer een <code>.knxproj</code> lokaal (ZIP → XML → YAML). Niets
              verlaat je browser.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Upload & opties</CardTitle>
            <CardDescription>
              Kies een bestand of sleep het in het vak hieronder.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* dropzone */}
            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={[
                "relative flex min-h-[140px] items-center justify-center rounded-xl border-2 border-dashed transition",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/20 hover:bg-muted/40",
              ].join(" ")}
            >
              <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
                <UploadCloud className="h-6 w-6 opacity-80" />
                <div className="text-sm">
                  Sleep je <code>.knxproj</code> hierheen of
                  <span className="mx-1 font-medium">klik</span> hieronder om te
                  selecteren.
                </div>
                <div className="text-xs text-muted-foreground">
                  Ondersteund: <code>.knxproj</code> (ZIP met XML)
                </div>
              </div>
              <Input
                type="file"
                accept=".knxproj,application/zip"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                aria-label=".knxproj bestand"
              />
            </div>

            {/* options row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <Label className="mb-1 block text-xs text-muted-foreground">
                  Geselecteerd bestand
                </Label>
                <div className="truncate text-sm">
                  {file ? (
                    <Badge variant="secondary" className="max-w-full truncate">
                      {file.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      Geen bestand geselecteerd
                    </span>
                  )}
                </div>
              </div>

              <div className="inline-flex h-9 items-center gap-3">
                <div className="inline-flex items-center gap-2">
                  <Switch
                    id="opt-reserve"
                    checked={dropReserveFromUnknown}
                    onCheckedChange={setDropReserveFromUnknown}
                    disabled={busy}
                  />
                  <Label
                    htmlFor="opt-reserve"
                    className="cursor-pointer text-sm leading-none"
                  >
                    Filter <code>Reserve</code> uit <code>_unknown</code>
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 md:justify-end">
                <Button onClick={handleParse} disabled={!file || busy}>
                  {busy ? "Bezig…" : "Parsen"}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={busy && !catalog}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            {busy && (
              <div className="flex items-center gap-3">
                <Progress value={progress} className="h-2 w-full" />
                <span className="text-xs text-muted-foreground">
                  {progress ? `${progress}%` : "…"}
                </span>
              </div>
            )}

            {workerError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <Bug className="mr-2 inline h-4 w-4" />
                {workerError}
              </div>
            )}
          </CardContent>

          <Separator />

          <CardContent className="pt-6">
            {!catalog ? (
              <p className="text-sm text-muted-foreground">
                Nog niets geüpload. Sleep een bestand in het vak of klik om te
                selecteren.
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                  <div className="text-muted-foreground">
                    Project:{" "}
                    <span className="font-medium text-foreground">
                      {catalog.project_name ?? "Onbekend"}
                    </span>
                    <span className="mx-2">•</span>
                    {catalog.group_addresses.length} group addresses
                  </div>
                  <div className="ms-auto flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadText("knx_catalog.yaml", catalogYaml)
                      }
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Catalog YAML
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadText("knx_homeassistant.yaml", haYaml)
                      }
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Home Assistant YAML
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="ha" className="w-full">
                  <TabsList>
                    <TabsTrigger value="ha">Home Assistant YAML</TabsTrigger>
                    <TabsTrigger value="catalog">Catalog YAML</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ha" className="mt-3">
                    <CodePanel
                      value={haYaml}
                      onCopy={() => copyToClipboard(haYaml)}
                      ariaLabel="Home Assistant YAML"
                    />
                  </TabsContent>

                  <TabsContent value="catalog" className="mt-3">
                    <CodePanel
                      value={catalogYaml}
                      onCopy={() => copyToClipboard(catalogYaml)}
                      ariaLabel="Catalog YAML"
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>

          <CardFooter />
        </Card>
      </div>
    </TooltipProvider>
  );
}

function CodePanel({
  value,
  onCopy,
}: {
  value: string;
  onCopy: () => Promise<boolean>;
  ariaLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label="Kopieer"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={6}>
            Kopieer naar klembord
          </TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="h-[28rem] rounded-lg border bg-muted/40">
        <pre className="whitespace-pre-wrap p-4 text-xs">{value}</pre>
      </ScrollArea>
    </div>
  );
}
