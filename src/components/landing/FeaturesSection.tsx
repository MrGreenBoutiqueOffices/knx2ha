"use client";

import { Upload, Code, Zap, FileDown, Settings, Shield, Sparkles, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Upload,
    title: "Drag & Drop Upload",
    description:
      "Simply drop your .knxproj in the browser. No install, no server uploads — everything runs locally.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    iconColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Zap,
    title: "Blazing fast",
    description:
      "Powered by Web Workers for peak performance. Process large projects in seconds without freezing your browser.",
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Code,
    title: "Smart detection",
    description:
      "Intelligent logic auto-detects entity types, sensor classes, and device configurations from your KNX setup.",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Settings,
    title: "Full control",
    description:
      "Tweak every entity with an intuitive editor. Rename, configure, or hide entities before export.",
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    iconColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  {
    icon: FileDown,
    title: "Multiple export formats",
    description:
      "Export as a single YAML file or an organized ZIP archive. Ready to paste into Home Assistant.",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    iconColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "100% Private",
    description:
      "Your data never leaves your device. Everything runs client-side in your browser. Zero privacy worries.",
    gradient: "from-green-500 via-lime-500 to-emerald-500",
    iconColor: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Sparkles,
    title: "Modern interface",
    description:
      "Beautiful, responsive interface with dark mode support. Seamless on desktop, tablet, and mobile.",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Clock,
    title: "Save time",
    description:
      "What once took hours of YAML now takes seconds. Focus on your smart home, not on config.",
    gradient: "from-amber-500 via-yellow-500 to-orange-500",
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.06),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.05),transparent_45%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Powerful features
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything you need</h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            A clear toolset to bring KNX projects into Home Assistant with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group h-full border border-border/60 bg-card/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-full flex-col gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-foreground">
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                  <div className="mt-auto h-1 w-16 rounded-full bg-primary/20 transition group-hover:bg-primary/40" />
                </div>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}

function BadgeItem({ icon: Icon, label }: { icon: typeof Shield; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </span>
  );
}
