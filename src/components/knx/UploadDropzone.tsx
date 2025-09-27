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
  const inputRef = useRef<HTMLInputElement | null>(null);

  function commit(file: File | null) {
    onSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    commit(f);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (e.currentTarget === dropRef.current) setIsDragging(false);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    commit(f);
  }

  return (
    <div
      ref={dropRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={[
        "relative flex min-h-[120px] sm:min-h-[140px] items-center justify-center rounded-xl border-2 border-dashed transition",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/20 hover:bg-muted/40",
      ].join(" ")}
    >
      <div className="pointer-events-none flex flex-col items-center gap-2 text-center px-3">
        <UploadCloud className="h-5 w-5 opacity-80 sm:h-6 sm:w-6" />
        <div className="text-xs sm:text-sm">
          Drag your <code>.knxproj</code> here or
          <span className="mx-1 font-medium">click</span> below to select
        </div>
        <div className="text-[0.7rem] text-muted-foreground sm:text-xs">
          Supports: <code>.knxproj</code> (ZIP met XML)
        </div>
      </div>

      <Input
        ref={inputRef}
        type="file"
        accept=".knxproj,application/zip"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={onChange}
        aria-label=".knxproj file"
      />
    </div>
  );
}
