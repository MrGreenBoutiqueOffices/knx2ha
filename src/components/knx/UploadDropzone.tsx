"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileArchive } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadDropzone({
  onSelect,
  className,
}: {
  onSelect: (f: File | null) => void;
  className?: string;
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
      className={cn(
        "group relative overflow-hidden flex min-h-[180px] sm:min-h-[220px] cursor-pointer items-center justify-center rounded-2xl border border-border/70 bg-gradient-to-br from-background via-muted/60 to-background transition-all",
        className,
        isDragging
          ? "border-primary/70 shadow-[0_18px_60px_-25px_rgba(16,185,129,0.6)]"
          : "hover:border-primary/50 hover:shadow-[0_14px_50px_-28px_rgba(0,0,0,0.4)]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 blur-3xl" aria-hidden>
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/15" />
        <div className="absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-amber-300/15" />
      </div>

      {/* Content */}
      <div className="pointer-events-none relative flex flex-col items-center gap-4 px-6 py-10 text-center">
        {/* Icon */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-background/85 to-background/95 p-4 shadow-sm transition-all">
          <UploadCloud
            className={cn(
              "h-12 w-12 transition-colors drop-shadow-sm",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
            strokeWidth={1.5}
          />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <div
            className={cn(
              "text-base font-semibold tracking-tight",
              isDragging ? "text-primary" : "text-foreground"
            )}
          >
            {isDragging ? "Release file" : "Upload .knxproj file"}
          </div>
          <div className="text-sm text-muted-foreground">
            {isDragging ? "Drop to upload" : "Drag & drop or click to select"}
          </div>
        </div>

        {/* File type indicator */}
        <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-foreground shadow-sm ring-1 ring-border/50">
          <FileArchive className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">.knxproj</span>
        </div>
      </div>

      {/* Hidden file input */}
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
