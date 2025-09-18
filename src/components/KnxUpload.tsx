"use client";

import { useMemo, useState } from "react";
import type { KnxCatalog } from "@/lib/types";
import {
  toCatalogYaml,
  toHomeAssistantYaml,
  buildHaEntities,
  summarizeEntities,
} from "@/lib/knx/export";
import { useKnxWorker } from "@/hooks/useKnxWorker";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PackageOpen, FileDown } from "lucide-react";

import { downloadText } from "@/lib/utils/download";
import UploadDropzone from "./knx/UploadDropzone";
import OptionsBar from "./knx/OptionsBar";
import ProgressInfo from "./knx/ProgressInfo";
import StatsBar from "./knx/StatsBar";
import CodePanel from "./knx/CodePanel";

export default function KnxUpload() {
  const { parse, busy, progress, progressInfo, error } = useKnxWorker();

  const [file, setFile] = useState<File | null>(null);
  const [catalog, setCatalog] = useState<KnxCatalog | null>(null);
  const [dropReserveFromUnknown, setDropReserveFromUnknown] = useState(true);
  const [dzKey, setDzKey] = useState(0);

  const projectName = catalog?.project_name ?? "Unknown";
  const groupAddressCount = catalog?.group_addresses.length ?? 0;

  const entities = useMemo(
    () =>
      catalog ? buildHaEntities(catalog, { dropReserveFromUnknown }) : null,
    [catalog, dropReserveFromUnknown]
  );
  const summary = useMemo(
    () => (entities ? summarizeEntities(entities) : null),
    [entities]
  );

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
    if (!file || busy) return;
    try {
      const cat = await parse(file);
      setCatalog(cat);
      toast.success("Ready", {
        description: `${cat.group_addresses.length} group addresses found.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not parse the file.";
      toast.error("Parsing error", { description: msg });
      setCatalog(null);
    }
  }

  function handleReset() {
    setFile(null);
    setCatalog(null);
    setDzKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
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
                <Badge variant="secondary">{projectName}</Badge>
              )}
              {catalog && (
                <Badge variant="outline">{groupAddressCount} GA&apos;s</Badge>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This tool helps you convert your KNX project into a Home Assistant
            YAML configuration.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Upload & options</CardTitle>
          <CardDescription>
            Choose a file or drag it into the box below.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <UploadDropzone key={dzKey} onSelect={setFile} />

          <OptionsBar
            file={file}
            busy={busy}
            dropReserveFromUnknown={dropReserveFromUnknown}
            onToggleReserve={setDropReserveFromUnknown}
            onParse={handleParse}
            onReset={handleReset}
          />

          <ProgressInfo
            busy={busy}
            progress={progress}
            info={progressInfo}
            error={error}
          />
        </CardContent>

        <Separator />

        {/* Stats */}
        {entities && summary && (
          <>
            <CardContent className="pt-4">
              <StatsBar summary={summary} />
            </CardContent>
            <Separator />
          </>
        )}

        {/* YAML Tabs */}
        <CardContent className="pt-6">
          {!catalog ? (
            <p className="text-sm text-muted-foreground">
              Nothing uploaded yet. Drag a file into the box or click to select
              it.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                <div className="text-muted-foreground">
                  Project:{" "}
                  <span className="font-medium text-foreground">{projectName}</span>
                  <span className="mx-2">•</span>
                  {groupAddressCount} group addresses
                </div>
                <div className="ms-auto flex gap-2">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() =>
                      downloadText("knx_catalog.yaml", catalogYaml)
                    }
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Catalog YAML
                  </Button>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
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
                  <TabsTrigger className="cursor-pointer" value="ha">
                    Home Assistant YAML
                  </TabsTrigger>
                  <TabsTrigger className="cursor-pointer" value="catalog">
                    Catalog YAML
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ha" className="mt-3">
                  <CodePanel value={haYaml} ariaLabel="Home Assistant YAML" />
                </TabsContent>

                <TabsContent value="catalog" className="mt-3">
                  <CodePanel value={catalogYaml} ariaLabel="Catalog YAML" />
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>

        <CardFooter />
      </Card>
    </div>
  );
}
