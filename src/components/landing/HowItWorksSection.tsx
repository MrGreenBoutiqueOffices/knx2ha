"use client";

import { Upload, Cog, FileCheck, Download, Sparkles, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload your project",
    description: "Drag your .knxproj into the browser. Processing is fully local.",
    number: "01",
  },
  {
    icon: Cog,
    title: "Automatic detection",
    description: "Entities and types are detected automatically without manual work.",
    number: "02",
  },
  {
    icon: FileCheck,
    title: "Review & adjust",
    description: "Rename or fine-tune each entity with a clear editor.",
    number: "03",
  },
  {
    icon: Download,
    title: "Export to YAML",
    description: "Export ready-to-use YAML for Home Assistant.",
    number: "04",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-background pb-24 pt-14 sm:pb-28 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(6,182,212,0.05),transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            How it works
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">From upload to YAML</h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Four steps to a clean Home Assistant configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-2xl border border-border/60 bg-card/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{step.number}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute right-3 top-1/2 hidden h-px w-10 translate-y-[-50%] bg-gradient-to-r from-border via-border/60 to-transparent lg:block">
                    <ArrowRight className="absolute -right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
