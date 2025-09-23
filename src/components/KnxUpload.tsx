"use client";

import { useCallback, useMemo, useState } from "react";
import type { KnxCatalog } from "@/lib/types";
import {
  toCatalogYaml,
  buildHaEntities,
  summarizeEntities,
  haEntitiesToYaml,
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
import EntityConfigurator from "./entity/EntityConfigurator";
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

export default function KnxUpload() {
  const { parse, busy, progress, progressInfo, error } = useKnxWorker();

  const [file, setFile] = useState<File | null>(null);
  const [catalog, setCatalog] = useState<KnxCatalog | null>(null);
  const [dropReserveFromUnknown, setDropReserveFromUnknown] = useState(true);
  const [dzKey, setDzKey] = useState(0);

  const projectName = catalog?.meta?.name ?? "Unknown";
  const groupAddressCount = useMemo(() => {
    if (!catalog) return 0;
    if (catalog.groupAddresses?.flat) return catalog.groupAddresses.flat.length;
    const maybeLegacy = catalog as unknown as { group_addresses?: Array<{ id: string }> };
    if (Array.isArray(maybeLegacy.group_addresses)) return maybeLegacy.group_addresses.length;
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
    const idx: Record<string, { name?: string; dpt?: string; id?: string }> = {};
    if (!catalog) return idx;
    if (catalog.groupAddresses?.flat) {
      for (const ga of catalog.groupAddresses.flat) {
        idx[ga.address] = { name: ga.name, dpt: ga.datapointType, id: ga.id };
      }
    } else {
      const maybeLegacy = catalog as unknown as { group_addresses?: Array<{ id: string; name?: string; address: string; dpt?: string }> };
      if (Array.isArray(maybeLegacy.group_addresses)) {
        for (const ga of maybeLegacy.group_addresses) {
          idx[ga.address] = { name: ga.name, dpt: ga.dpt, id: ga.id };
        }
      }
    }
    return idx;
  }, [catalog]);

  const catalogYaml = useMemo(() => (catalog ? toCatalogYaml(catalog) : ""), [catalog]);

  const haYaml = useMemo(
    () => (adjustedEntities ? haEntitiesToYaml(adjustedEntities) : ""),
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
              {catalog && <Badge variant="secondary">{projectName}</Badge>}
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
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                <div className="text-muted-foreground">
                  Project:{" "}
                  <span className="font-medium text-foreground">
                    {projectName}
                  </span>
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
