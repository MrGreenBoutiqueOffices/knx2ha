"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { UploadCloud } from "lucide-react";

export default function UploadDropzone({
  onSelect,
}: {
  onSelect: (f: File | null) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    onSelect(f ?? null);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    if (e.currentTarget === dropRef.current) setIsDragging(false);
  }

  return (
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
          Drag your <code>.knxproj</code> here or
          <span className="mx-1 font-medium">click</span> below to select
        </div>
        <div className="text-xs text-muted-foreground">
          Supports: <code>.knxproj</code> (ZIP met XML)
        </div>
      </div>
      <Input
        type="file"
        accept=".knxproj,application/zip"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        aria-label=".knxproj file"
      />
    </div>
  );
}
