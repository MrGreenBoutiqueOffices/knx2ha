import { Footer } from "@/components/landing/Footer";
import {
  AlertCircle,
  Database,
  FileSearch,
  Lightbulb,
  Settings,
  Zap
} from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">About KNX2HA</h1>
          <p className="text-xl text-muted-foreground">
            Understanding KNX project file parsing
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* Introduction */}
          <section className="prose prose-neutral dark:prose-invert max-w-none">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
              <Lightbulb className="w-6 h-6" />
              What does KNX2HA do?
            </h2>
            <p className="text-muted-foreground">
              KNX2HA is a tool that analyzes KNX project files (.knxproj) and automatically
              generates Home Assistant configurations. The goal is to speed up and simplify
              the manual configuration of KNX devices in Home Assistant.
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
                  While KNX is a standardized protocol, the standardization primarily covers
                  data types (DPT). The <strong>semantic meaning</strong> of group addresses
                  must be inferred from metadata, naming conventions, and address structure -
                  all of which vary by project.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-primary" />
                  2. Inconsistent metadata
                </h3>
                <p className="text-sm text-muted-foreground">
                  KNX project files are configured using ETS (Engineering Tool Software), but
                  the quality and completeness of metadata depends on:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>The integrator who created the project</li>
                  <li>What naming conventions they use</li>
                  <li>Whether they properly linked device channels and com objects</li>
                  <li>Whether DPT types are filled in for group addresses</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  3. Implicit relationships
                </h3>
                <p className="text-sm text-muted-foreground">
                  KNX group addresses are flat - there's no explicit structure that says
                  "these 3 addresses form one light entity". KNX2HA must infer this through:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Device channel analysis (most reliable)</li>
                  <li>LA-prefix patterns (e.g., "LA01 on", "LA01 dim")</li>
                  <li>Address ranges (e.g., 1/1/x for lights)</li>
                  <li>Suffix patterns (e.g., "Lamp s", "Lamp d", "Lamp w")</li>
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
              To properly parse different project files, KNX2HA uses multiple strategies in
              order of reliability:
            </p>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>
                <strong>Structured Mapping (Device Channels)</strong> - Most reliable.
                Uses device topology and channel definitions from ETS.
              </li>
              <li>
                <strong>Link-driven Aggregation</strong> - Uses explicit links between
                com objects and group addresses.
              </li>
              <li>
                <strong>LA-Pattern Aggregation</strong> - Recognizes "LA01", "LA02" patterns
                with suffixes like " on", " off", " dim".
              </li>
              <li>
                <strong>Address-based Aggregation</strong> - Groups addresses within the same
                address range (e.g., 1/1/0-2 for one light).
              </li>
              <li>
                <strong>Name-based Aggregation</strong> - Matches complex names like
                "Physics 0.01 s", "Physics 0.01 d", "Physics 0.01 w".
              </li>
              <li>
                <strong>Heuristics</strong> - Last fallback: classification based on
                DPT type, name keywords, and address patterns.
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
                <strong>KNX2HA is a tool, not a replacement for manual verification.</strong>
              </p>
              <p>
                Our tests and validation show a classification accuracy of approximately <strong>~95%</strong> for
                well-structured KNX projects. This means that:
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Most entities are correctly classified (light, switch, sensor, etc.)</li>
                <li>
                  There may always be some edge cases that require manual adjustment
                </li>
                <li>
                  Projects with inconsistent naming or incomplete metadata may require more manual work
                </li>
                <li>
                  Complex configurations (such as RGB lights, HVAC systems) may not be fully
                  automatically recognized
                </li>
              </ul>
              <p className="font-semibold text-amber-700 dark:text-amber-400 mt-4">
                ⚠️ Always verify the generated configuration before using it in production!
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
                <strong>Use clear names in ETS</strong> - Descriptive names like
                "Living Room Light" work better than "LA01".
              </li>
              <li>
                <strong>Fill in DPT types</strong> - This greatly helps with correct classification.
              </li>
              <li>
                <strong>Structure with channels</strong> - Use device channels to group related
                group addresses.
              </li>
              <li>
                <strong>Use user hints</strong> - You can use `[switch]`, `[light]`, `[sensor]`,
                etc. in names to force classification.
              </li>
              <li>
                <strong>Use the entity configurator</strong> - In the tool, you can adjust entities,
                rename, or remove them before exporting.
              </li>
            </ul>
          </section>

          {/* Technical Details */}
          <section className="bg-muted/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Technical details</h2>
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
            <h2 className="text-2xl font-semibold mb-4">Open Source</h2>
            <p className="text-muted-foreground mb-4">
              KNX2HA is open source software. Contributions, bug reports, and feature requests
              are welcome!
            </p>
            <a
              href="https://github.com/MrGreenBoutiqueOffices/knx2ha"
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
