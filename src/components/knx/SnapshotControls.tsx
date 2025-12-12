"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Download, Save, Upload } from "lucide-react";

type Props = {
  busy: boolean;
  hasCatalog: boolean;
  onImportConfig: () => void;
  onExportConfig: () => void;
};

export default function SnapshotControls({ busy, hasCatalog, onImportConfig, onExportConfig }: Props) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return window.matchMedia("(min-width: 640px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(min-width: 640px)");
    const update = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const dialogOpen = open && isDesktop;
  const sheetOpen = open && !isDesktop;
  const description = "Export saves the current state; import reloads it.";
  const detail =
    "Snapshots include catalog data, override settings, and your filtering options, so you can resume later or hand the session to a coworker.";

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={busy}
        className="text-sm font-semibold w-full sm:w-auto"
      >
        <Save className="mr-1 h-4 w-4" />
        Snapshot
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setOpen}>
          <DialogContent className="hidden sm:block sm:max-w-lg">
            <DialogHeader className="text-left">
              <DialogTitle>Config snapshot</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">{detail}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Button
                    variant="outline"
                    onClick={onImportConfig}
                    disabled={busy}
                    className="w-full text-sm font-semibold"
                  >
                    <Upload className="mr-1 h-4 w-4" />
                    Import config
                  </Button>
                </div>
                <div>
                    <Button
                      variant="default"
                      onClick={onExportConfig}
                      disabled={!hasCatalog || busy}
                      className="w-full text-sm font-semibold"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Export config
                    </Button>
                </div>
              </div>
            </div>
          </DialogContent>
      </Dialog>
      <Sheet open={sheetOpen} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="sm:hidden">
            <SheetHeader>
              <SheetTitle>Config snapshot</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">{detail}</p>
              <Button
                variant="outline"
                onClick={onImportConfig}
                disabled={busy}
                className="w-full text-sm font-semibold"
              >
                <Upload className="mr-1 h-4 w-4" />
                Import config
              </Button>
              <Button
                variant="default"
                onClick={onExportConfig}
                disabled={!hasCatalog || busy}
                className="w-full text-sm font-semibold"
              >
                <Download className="mr-1 h-4 w-4" />
                Export config
              </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
