"use client";

import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function Stepper({
  step,
  onStepChange,
  hasCatalog,
}: {
  step: Step;
  onStepChange: (s: Step) => void;
  hasCatalog: boolean;
}) {
  const steps = [
    { id: 1 as const, label: "Upload", desc: "Upload and parse your .knxproj" },
    { id: 2 as const, label: "Entities", desc: "Review and adjust entities" },
    { id: 3 as const, label: "YAML", desc: "View, search, and export YAML" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((s) => {
        const isActive = s.id === step;
        const isClickable = s.id === 1 || hasCatalog || s.id <= step;
        return (
          <div key={s.id} className="flex min-w-[200px] flex-1 items-center gap-3">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepChange(s.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card/80 text-muted-foreground hover:text-foreground",
                !isClickable && "opacity-50"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {s.id}
              </span>
              <div className="flex-1 text-left">
                <div>{s.label}</div>
                <p className="text-[0.7rem] text-muted-foreground">{s.desc}</p>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
