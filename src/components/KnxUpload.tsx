"use client";

import { useCallback, useMemo, useState } from "react";
import type { KnxCatalog } from "@/lib/types";
import {
  toCatalogYaml,
  buildHaEntities,
  summarizeEntities,
  haEntitiesToYaml,
  haEntitiesToYamlForDomain,
  HaDomain,
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
import { Copy } from "lucide-react";

import { downloadText } from "@/lib/utils/download";
import {
  buildSavedConfig,
  parseSavedConfig,
  stringifySavedConfig,
} from "@/lib/utils/config";
import UploadDropzone from "./knx/UploadDropzone";
import OptionsBar from "./knx/OptionsBar";
import ProgressInfo from "./knx/ProgressInfo";
import StatsBar from "./knx/StatsBar";
import CodePanel from "./knx/CodePanel";
import ExportWizard from "./knx/ExportWizard";
import EntityConfigurator from "./entity/EntityConfigurator";
import ThemeToggle from "@/components/ThemeToggle";
import VersionTag from "@/components/VersionTag";
import {
  DOMAIN_BY_COLLECTION,
  applyEntityOverride,
  cleanOverride,
  Entities,
  EntityDomain,
  DomainEntityMap,
  EntityOverride,
  EntityOverrides,
  hasOverrideValues,
  KeyedEntities,
  makeEntityKey,
} from "./entity/entity-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function KnxUpload() {
  const { parse, busy, progress, progressInfo, error } = useKnxWorker();

  const [file, setFile] = useState<File | null>(null);
  const [catalog, setCatalog] = useState<KnxCatalog | null>(null);
  const [dropReserveFromUnknown, setDropReserveFromUnknown] = useState(true);
  const [dzKey, setDzKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  const projectName = catalog?.meta?.name ?? "Unknown";
  const groupAddressCount = useMemo(() => {
    if (!catalog) return 0;
    if (catalog.groupAddresses?.flat) return catalog.groupAddresses.flat.length;
    const maybeLegacy = catalog as unknown as {
      group_addresses?: Array<{ id: string }>;
    };
    if (Array.isArray(maybeLegacy.group_addresses))
      return maybeLegacy.group_addresses.length;
    return 0;
  }, [catalog]);

  const [entityOverrides, setEntityOverrides] = useState<EntityOverrides>({});

  const baseEntities = useMemo(
    () =>
      catalog ? buildHaEntities(catalog, { dropReserveFromUnknown }) : null,
    [catalog, dropReserveFromUnknown]
  );

  const keyedEntities = useMemo<KeyedEntities | null>(() => {
    if (!baseEntities) return null;
    return {
      switches: baseEntities.switches.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.switches;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      binarySensors: baseEntities.binarySensors.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.binarySensors;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      lights: baseEntities.lights.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.lights;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      sensors: baseEntities.sensors.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.sensors;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      times: baseEntities.times.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.times;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      dates: baseEntities.dates.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.dates;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      datetimes: baseEntities.datetimes.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.datetimes;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      covers: baseEntities.covers.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.covers;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      scenes: baseEntities.scenes.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.scenes;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
      unknowns: baseEntities.unknowns.map((entity, index) => {
        const domain = DOMAIN_BY_COLLECTION.unknowns;
        const key = makeEntityKey(domain, entity, index);
        return {
          key,
          domain,
          base: entity,
          current: applyEntityOverride(domain, key, entity, entityOverrides),
        };
      }),
    } satisfies KeyedEntities;
  }, [baseEntities, entityOverrides]);

  const adjustedEntities = useMemo(() => {
    if (!keyedEntities) return null;
    return {
      switches: keyedEntities.switches.map((item) => item.current),
      binarySensors: keyedEntities.binarySensors.map((item) => item.current),
      lights: keyedEntities.lights.map((item) => item.current),
      sensors: keyedEntities.sensors.map((item) => item.current),
      times: keyedEntities.times.map((item) => item.current),
      dates: keyedEntities.dates.map((item) => item.current),
      datetimes: keyedEntities.datetimes.map((item) => item.current),
      covers: keyedEntities.covers.map((item) => item.current),
      scenes: keyedEntities.scenes.map((item) => item.current),
      unknowns: keyedEntities.unknowns.map((item) => item.current),
    } satisfies Entities;
  }, [keyedEntities]);

  const summary = useMemo(
    () => (adjustedEntities ? summarizeEntities(adjustedEntities) : null),
    [adjustedEntities]
  );

  const addressIndex = useMemo(() => {
    const idx: Record<string, { name?: string; dpt?: string; id?: string }> =
      {};
    if (!catalog) return idx;
    if (catalog.groupAddresses?.flat) {
      for (const ga of catalog.groupAddresses.flat) {
        idx[ga.address] = { name: ga.name, dpt: ga.datapointType, id: ga.id };
      }
    } else {
      const maybeLegacy = catalog as unknown as {
        group_addresses?: Array<{
          id: string;
          name?: string;
          address: string;
          dpt?: string;
        }>;
      };
      if (Array.isArray(maybeLegacy.group_addresses)) {
        for (const ga of maybeLegacy.group_addresses) {
          idx[ga.address] = { name: ga.name, dpt: ga.dpt, id: ga.id };
        }
      }
    }
    return idx;
  }, [catalog]);

  const catalogYaml = useMemo(
    () => (catalog ? toCatalogYaml(catalog) : ""),
    [catalog]
  );

  const haYaml = useMemo(
    () => (adjustedEntities ? haEntitiesToYaml(adjustedEntities) : ""),
    [adjustedEntities]
  );

  const handleCopyDomain = useCallback(
    async (domain: HaDomain) => {
      if (!adjustedEntities) return;
      const yaml = haEntitiesToYamlForDomain(adjustedEntities, domain);
      try {
        await navigator.clipboard.writeText(yaml);
        const labelMap: Record<HaDomain, string> = {
          switch: "Switches",
          binary_sensor: "Binary sensors",
          light: "Lights",
          sensor: "Sensors",
          time: "Times",
          date: "Dates",
          datetime: "DateTimes",
          cover: "Covers",
          scene: "Scenes",
          _unknown: "Unknown",
        };
        toast.success("Copied", {
          description: `${labelMap[domain]} YAML copied to clipboard`,
        });
      } catch {
        toast.error("Copy failed", {
          description: "Could not copy text.",
        });
      }
    },
    [adjustedEntities]
  );

  const handleOverrideChange = useCallback(
    (
      domain: EntityDomain,
      key: string,
      base: DomainEntityMap[EntityDomain],
      patch: Partial<EntityOverride>
    ) => {
      setEntityOverrides((prev) => {
        const prevEntry = prev[key] ?? {};
        const merged: EntityOverride = { ...prevEntry, ...patch };
        const cleaned = cleanOverride(domain, base, merged);
        if (!hasOverrideValues(cleaned)) {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }
        if (
          prevEntry.name === cleaned.name &&
          prevEntry.invert_position === cleaned.invert_position &&
          prevEntry.invert_angle === cleaned.invert_angle
        ) {
          return prev;
        }
        return { ...prev, [key]: cleaned };
      });
    },
    []
  );

  const handleOverrideReset = useCallback((key: string) => {
    setEntityOverrides((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Export/import of full working configuration
  const handleExportConfig = useCallback(() => {
    if (!catalog) {
      toast.error("Nothing to export", {
        description: "Upload and parse a project first.",
      });
      return;
    }
    const cfg = buildSavedConfig({
      catalog,
      overrides: entityOverrides,
      dropReserveFromUnknown,
    });
    const filenameSafe = (projectName || "project").replace(
      /[^a-z0-9_-]+/gi,
      "_"
    );
    downloadText(
      `${filenameSafe}_knx2ha_config.json`,
      stringifySavedConfig(cfg)
    );
  }, [catalog, entityOverrides, dropReserveFromUnknown, projectName]);

  const handleImportConfig = useCallback(async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      const pick = await new Promise<File | null>((resolve) => {
        input.onchange = () =>
          resolve(input.files && input.files[0] ? input.files[0] : null);
        input.click();
      });
      if (!pick) return;
      const text = await pick.text();
      const cfg = parseSavedConfig(text);
      setCatalog(cfg.catalog);
      setEntityOverrides(cfg.overrides || {});
      setDropReserveFromUnknown(Boolean(cfg.options?.dropReserveFromUnknown));
      const overrideCount = Object.keys(cfg.overrides || {}).length;
      const gaCount =
        (cfg.catalog.groupAddresses &&
        Array.isArray(cfg.catalog.groupAddresses.flat)
          ? cfg.catalog.groupAddresses.flat.length
          : 0) ||
        (Array.isArray(cfg.catalog.group_addresses)
          ? cfg.catalog.group_addresses.length
          : 0);
      const project = cfg.project ?? cfg.catalog.meta?.name ?? "Unknown";
      toast.success("Configuration loaded", {
        description: `${project} • ${gaCount} GA's • ${overrideCount} overrides`,
      });
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not import configuration";
      toast.error("Import failed", { description: msg });
    }
  }, []);

  async function handleParse() {
    if (!file || busy) return;
    try {
      const cat = await parse(file);
      setCatalog(cat);
      setEntityOverrides({});
      toast.success("Ready", {
        description: `${cat.group_addresses.length} group addresses found.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not parse the file.";
      toast.error("Parsing error", { description: msg });
      setCatalog(null);
      setEntityOverrides({});
    }
  }

  function handleReset() {
    setFile(null);
    setCatalog(null);
    setDzKey((k) => k + 1);
    setEntityOverrides({});
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-muted p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <PackageOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                KNX → Home Assistant
              </h1>
            </div>
            <div className="ms-auto flex items-center gap-2">
              {catalog && <Badge variant="secondary">{projectName}</Badge>}
              {catalog && (
                <Badge variant="outline">{groupAddressCount} GA&apos;s</Badge>
              )}
              <ThemeToggle variant="ghost" size="icon" />
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This tool helps you convert your KNX project into a Home Assistant
            YAML configuration.
          </p>
          <div className="mt-2 sm:hidden">
            <VersionTag className="inline-block" />
          </div>
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
            onImportConfig={handleImportConfig}
            onExportConfig={handleExportConfig}
            canExport={Boolean(catalog)}
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
        {adjustedEntities && summary && (
          <>
            <CardContent className="pt-4">
              <StatsBar summary={summary} />
            </CardContent>
            <Separator />
          </>
        )}

        {/* Entity configuration */}
        {keyedEntities && adjustedEntities && (
          <>
            <CardContent className="pt-4">
              <EntityConfigurator
                entities={keyedEntities}
                overrides={entityOverrides}
                addressIndex={addressIndex}
                onChange={handleOverrideChange}
                onReset={handleOverrideReset}
              />
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
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="text-muted-foreground">
                  Project:{" "}
                  <span className="font-medium text-foreground">
                    {projectName}
                  </span>
                  <span className="mx-2">•</span>
                  {groupAddressCount} group addresses
                </div>
                <div className="ms-auto flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer sm:w-auto"
                    onClick={() =>
                      downloadText("knx_catalog.yaml", catalogYaml)
                    }
                  >
                    <FileDown className="h-4 w-4" />
                    Catalog YAML
                  </Button>
                  {adjustedEntities ? (
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer sm:w-auto"
                      onClick={() => setExportOpen(true)}
                    >
                      <FileDown className="h-4 w-4" />
                      Home Assistant YAML
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer sm:w-auto"
                      onClick={() => downloadText("knx_homeassistant.yaml", haYaml)}
                    >
                      <FileDown className="h-4 w-4" />
                      Home Assistant YAML
                    </Button>
                  )}
                  {adjustedEntities && summary && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full cursor-pointer sm:w-auto">
                          <Copy className="mr-2 h-4 w-4" /> Copy per type
                          <span className="ml-1 text-muted-foreground">▾</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Copy YAML slice</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(haYaml).then(() => toast.success("Copied", { description: "Full YAML copied to clipboard" })).catch(() => toast.error("Copy failed", { description: "Could not copy text." }))}>
                          All (full config)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {summary.counts.switch > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("switch")}>Switches</DropdownMenuItem>
                        )}
                        {summary.counts.binary_sensor > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("binary_sensor")}>Binary sensors</DropdownMenuItem>
                        )}
                        {summary.counts.light > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("light")}>Lights</DropdownMenuItem>
                        )}
                        {summary.counts.sensor > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("sensor")}>Sensors</DropdownMenuItem>
                        )}
                        {summary.counts.time > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("time")}>Times</DropdownMenuItem>
                        )}
                        {summary.counts.date > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("date")}>Dates</DropdownMenuItem>
                        )}
                        {summary.counts.datetime > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("datetime")}>DateTimes</DropdownMenuItem>
                        )}
                        {summary.counts.cover > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("cover")}>Covers</DropdownMenuItem>
                        )}
                        {summary.counts.scene > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("scene")}>Scenes</DropdownMenuItem>
                        )}
                        {summary.counts._unknown > 0 && (
                          <DropdownMenuItem onClick={() => handleCopyDomain("_unknown")}>Unknown</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
        {adjustedEntities && (
          <ExportWizard
            open={exportOpen}
            onOpenChange={setExportOpen}
            projectName={projectName}
            entities={adjustedEntities}
          />
        )}
    </div>
  );
}
