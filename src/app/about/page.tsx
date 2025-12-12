import { Footer } from "@/components/landing/Footer";
import type { ComponentProps } from "react";
import {
  AlertCircle,
  Database,
  Download,
  FileSearch,
  FileText,
  Layers,
  Lightbulb,
  Settings,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";

type FeatureHighlight = {
  title: string;
  description: string;
  icon: (props: ComponentProps<typeof FileSearch>) => JSX.Element;
  accent: string;
  label: string;
};

const featureHighlights: FeatureHighlight[] = [
  {
    title: "KNX group address parsing",
    description:
      "Reads the ETS project, matches group addresses with DPT metadata and creates entities that can be exported to Home Assistant with minimal manual work.",
    icon: FileSearch,
    accent: "from-sky-400 via-blue-400 to-cyan-400",
    label: "Parse",
  },
  {
    title: "Multi-strategy heuristics",
    description:
      "Device channels, explicit links, LA-prefix patterns, address ranges and name keywords work together to guess the right entity type when data is inconsistent.",
    icon: Zap,
    accent: "from-amber-400 via-orange-400 to-red-400",
    label: "Classify",
  },
  {
    title: "Aggregate entity views",
    description:
      "Related addresses (on/off, dim, state, position, sensors) are grouped into logical sets so you can understand and adjust complex devices at a glance.",
    icon: Layers,
    accent: "from-emerald-400 via-lime-400 to-amber-400",
    label: "Group",
  },
  {
    title: "Manual overrides & configurator",
    description:
      "Use the built-in configurator to rename entities and tweak cover direction/invert settings before exporting so the YAML matches your naming and behavior standards.",
    icon: Settings,
    accent: "from-purple-400 via-indigo-400 to-sky-400",
    label: "Adjust",
  },
  {
    title: "Upload & preview workflow",
    description:
      "A Next.js front-end lets you upload .knxproj or zipped archives, preview the parsed catalog and tweak options such as reserved addresses before locking in an export.",
    icon: UploadCloud,
    accent: "from-cyan-400 via-sky-400 to-indigo-400",
    label: "Preview",
  },
  {
    title: "Snapshot export/import",
    description:
      "Save the parsed catalog, options and overrides to a JSON snapshot and reload it later or share it with a colleague to continue the same state.",
    icon: Download,
    accent: "from-pink-400 via-rose-400 to-red-400",
    label: "Snapshot",
  },
  {
    title: "Home Assistant YAML export",
    description:
      "Export a single file or a ZIP with per-domain YAML plus a root include; entity visibility matches the preview so exports stay trustworthy.",
    icon: FileText,
    accent: "from-lime-400 via-emerald-400 to-cyan-400",
    label: "Export",
  },
];

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">About KNX2HOME</h1>
            <p className="text-xl text-muted-foreground">
              Understanding KNX project file parsing
            </p>
          </div>

          {/* Feature overview */}
          <section className="mb-12 space-y-6">
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <Sparkles className="w-6 h-6 text-primary" />
                Features at a glance
              </h2>
              <p className="text-sm text-muted-foreground max-w-3xl">
                KNX2HOME bundles parsing intelligence with a workflow that keeps
                you in control: upload, review, adjust, and export everything
                you need for Home Assistant.
              </p>
              <p className="text-sm text-muted-foreground">
                Every stage of the flow is represented below so you can quickly
                see how the tool saves time, whether you’re importing projects,
                tweaking overrides, or exporting YAML.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureHighlights.map(
                ({ title, description, icon: Icon, accent, label }) => (
                  <article
                    key={title}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background/60 via-muted/40 to-background/80 p-4 text-sm shadow-sm transition duration-150 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${accent} opacity-0 transition duration-150 group-hover:opacity-20`}
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="relative rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold text-foreground/80">
                        {label}
                      </span>
                    </div>
                    <div className="relative">
                      <h3 className="font-semibold text-base leading-snug text-foreground">
                        {title}
                      </h3>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        {description}
                      </p>
                    </div>
                    <div
                      className={`relative h-1.5 w-16 rounded-full bg-gradient-to-r ${accent}`}
                    />
                  </article>
                ),
              )}
            </div>
          </section>

          {/* Main Content */}
          <div className="space-y-12">
            {/* Introduction */}
            <section className="prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
                <Lightbulb className="w-6 h-6" />
                What does KNX2HOME do?
              </h2>
              <p className="text-muted-foreground">
                KNX2HOME is a tool that analyzes KNX project files (.knxproj)
                and automatically generates Home Assistant configurations. The
                goal is to speed up and simplify the manual configuration of KNX
                devices in Home Assistant.
              </p>
            </section>

            {/* Parsing Complexity */}
            <section className="bg-card rounded-lg p-6 border">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
                <Settings className="w-6 h-6" />
                Why is parsing complex?
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    1. Gap between standard and practice
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    While KNX is a standardized protocol, the standardization
                    primarily covers data types (DPT). The{" "}
                    <strong>semantic meaning</strong> of group addresses must be
                    inferred from metadata, naming conventions, and address
                    structure - all of which vary by project.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-primary" />
                    2. Inconsistent metadata
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    KNX project files are configured using ETS (Engineering Tool
                    Software), but the quality and completeness of metadata
                    depends on:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>The integrator who created the project</li>
                    <li>What naming conventions they use</li>
                    <li>
                      Whether they properly linked device channels and com
                      objects
                    </li>
                    <li>Whether DPT types are filled in for group addresses</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    3. Implicit relationships
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    KNX group addresses are flat - there's no explicit structure
                    that says "these 3 addresses form one light entity".
                    KNX2HOME must infer this through:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Device channel analysis (most reliable)</li>
                    <li>LA-prefix patterns (e.g., "LA01 on", "LA01 dim")</li>
                    <li>Address ranges (e.g., 1/1/x for lights)</li>
                    <li>
                      Suffix patterns (e.g., "Lamp s", "Lamp d", "Lamp w")
                    </li>
                    <li>Name-based aggregation for complex structured names</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Multi-Strategy Approach */}
            <section className="prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
                <Database className="w-6 h-6" />
                Multi-strategy approach
              </h2>
              <p className="text-muted-foreground mb-4">
                To properly parse different project files, KNX2HOME uses
                multiple strategies in order of reliability:
              </p>
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li>
                  <strong>Structured Mapping (Device Channels)</strong> - Most
                  reliable. Uses device topology and channel definitions from
                  ETS.
                </li>
                <li>
                  <strong>Link-driven Aggregation</strong> - Uses explicit links
                  between com objects and group addresses.
                </li>
                <li>
                  <strong>LA-Pattern Aggregation</strong> - Recognizes "LA01",
                  "LA02" patterns with suffixes like " on", " off", " dim".
                </li>
                <li>
                  <strong>Address-based Aggregation</strong> - Groups addresses
                  within the same address range (e.g., 1/1/0-2 for one light).
                </li>
                <li>
                  <strong>Name-based Aggregation</strong> - Matches complex
                  names like "Physics 0.01 s", "Physics 0.01 d", "Physics 0.01
                  w".
                </li>
                <li>
                  <strong>Heuristics</strong> - Last fallback: classification
                  based on DPT type, name keywords, and address patterns.
                </li>
              </ol>
            </section>

            {/* Accuracy Notice */}
            <section className="bg-amber-500/10 dark:bg-amber-500/5 rounded-lg p-6 border border-amber-500/20">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4 text-amber-600 dark:text-amber-500">
                <AlertCircle className="w-6 h-6" />
                Important notice about reliability
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>
                    KNX2HOME is a tool, not a replacement for manual
                    verification.
                  </strong>
                </p>
                <p>
                  Our tests and validation show a classification accuracy of
                  approximately <strong>~95%</strong> for well-structured KNX
                  projects. This means that:
                </p>
                <ul className="space-y-2 list-disc list-inside ml-4">
                  <li>
                    Most entities are correctly classified (light, switch,
                    sensor, etc.)
                  </li>
                  <li>
                    There may always be some edge cases that require manual
                    adjustment
                  </li>
                  <li>
                    Projects with inconsistent naming or incomplete metadata may
                    require more manual work
                  </li>
                  <li>
                    Complex configurations (such as RGB lights, HVAC systems)
                    may not be fully automatically recognized
                  </li>
                </ul>
                <p className="font-semibold text-amber-700 dark:text-amber-400 mt-4">
                  ⚠️ Always verify the generated configuration before using it
                  in production!
                </p>
              </div>
            </section>

            {/* User Hints */}
            <section className="prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
                <Lightbulb className="w-6 h-6" />
                Tips for better results
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>
                  <strong>Use clear names in ETS</strong> - Descriptive names
                  like "Living Room Light" work better than "LA01".
                </li>
                <li>
                  <strong>Fill in DPT types</strong> - This greatly helps with
                  correct classification.
                </li>
                <li>
                  <strong>Structure with channels</strong> - Use device channels
                  to group related group addresses.
                </li>
                <li>
                  <strong>Use user hints</strong> - You can use `[switch]`,
                  `[light]`, `[sensor]`, etc. in names to force classification.
                </li>
                <li>
                  <strong>Use the entity configurator</strong> - In the tool,
                  you can adjust entities, rename, or remove them before
                  exporting.
                </li>
              </ul>
            </section>

            {/* Technical Details */}
            <section className="bg-muted/50 rounded-lg p-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
                <Layers className="w-6 h-6" />
                Technical details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">Supported DPT types:</h3>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• DPT 1.x (Boolean) - Switches, binary sensors</li>
                    <li>• DPT 3.7 (Dimming) - Light dimming control</li>
                    <li>• DPT 5.x (8-bit) - Brightness, angles, percentages</li>
                    <li>• DPT 9.x (Float) - Temperature, humidity, pressure</li>
                    <li>• DPT 10/11/19 - Time, date, datetime</li>
                    <li>• DPT 17/18 (Scene) - Scene triggers</li>
                    <li>• DPT 20.x - HVAC modes, delays</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Supported entities:</h3>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Switches (on/off control)</li>
                    <li>• Lights (with brightness/dimming)</li>
                    <li>• Binary Sensors (read-only booleans)</li>
                    <li>• Sensors (temperature, humidity, etc.)</li>
                    <li>• Covers (blinds, shutters)</li>
                    <li>• Scenes (scene activation)</li>
                    <li>• Time/Date/DateTime entities</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Open Source */}
            <section className="text-center py-8">
              <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
                <FileText className="w-6 h-6" />
                Open Source
              </h2>
              <p className="text-muted-foreground mb-4">
                KNX2HOME is open source software. Contributions, bug reports,
                and feature requests are welcome!
              </p>
              <a
                href="https://github.com/MrGreenBoutiqueOffices/knx2home"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                View on GitHub
              </a>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
