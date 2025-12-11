"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Play, Shield, Zap, Github, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/40 to-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(6,182,212,0.10),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.08),transparent_45%)]" />

      <div className="mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse items-start gap-6 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Smooth to Home Assistant
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                From KNX project to Home Assistant YAML in minutes.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Upload your .knxproj, get a clear entity configuration, adjust what you want, and export straight to YAML. All local, blazing fast, and privacy-first.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button asChild size="lg" className="px-6 text-base font-semibold shadow-md">
                <Link href="/tool">
                  <Play className="mr-2 h-5 w-5" />
                  Get started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-6 text-base font-semibold border-border"
              >
                <a href="https://github.com/MrGreenBoutiqueOffices/knx2ha" target="_blank" rel="noreferrer">
                  View on GitHub
                </a>
              </Button>
            </div>

            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
              <FeatureTile
                icon={Zap}
                title="Parse in seconds"
                desc="Multi-worker parsing built for KNX."
                accent="from-emerald-400/60 to-emerald-500/30"
              />
              <FeatureTile
                icon={Shield}
                title="Local & private"
                desc=".knxproj stays in your browser. Zero uploads."
                accent="from-sky-400/60 to-sky-500/30"
              />
              <FeatureTile
                icon={Github}
                title="Open source"
                desc="Transparent, auditable, community-driven."
                accent="from-amber-400/60 to-amber-500/30"
              />
            </div>

          </div>

          <div className="flex-1 w-full">
            <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-lg backdrop-blur">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="text-xl font-semibold text-foreground">Smart Home KNX</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                    YAML export
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Upload .knxproj</span>
                    <span>Step 1/3</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div className="h-2 w-1/3 rounded-full bg-primary" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      Upload
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>Entities</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">152</span>
                  </div>
                  <div className="space-y-2">
                    {["Switches", "Lights", "Sensors", "Covers"].map((label, idx) => (
                      <div key={label} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{label}</span>
                        <span className="font-medium text-foreground">{[52, 30, 56, 14][idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Export to YAML</p>
                      <p className="text-sm text-muted-foreground">Ready to paste into Home Assistant</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-3 rounded-xl bg-background p-3 text-xs font-mono text-muted-foreground">
                    homeassistant:<br />
                    &nbsp;&nbsp;switch:<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;- platform: knx<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;address: 1/0/1<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: Kitchen lights
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: typeof Zap;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("pointer-events-none absolute inset-0 opacity-70 blur-3xl", `bg-gradient-to-br ${accent}`)} />
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
