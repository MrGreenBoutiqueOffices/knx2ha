"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Check, Expand, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { yaml } from "@codemirror/lang-yaml";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
} from "@codemirror/view";
import { foldGutter, foldKeymap, indentOnInput, foldAll, unfoldAll } from "@codemirror/language";
import { keymap } from "@codemirror/view";

export default function CodePanel({
  value,
  ariaLabel,
  fullHeight = false,
  searchTerm,
  defaultCollapsed = false,
}: {
  value: string;
  ariaLabel: string;
  fullHeight?: boolean;
  searchTerm?: string;
  defaultCollapsed?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<EditorView | null>(null);

  useEffect(() => setMounted(true), []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied", {
        description: "YAML has been copied to the clipboard.",
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Copy failed", {
        description: "Could not copy text.",
      });
    }
  }

  const searchExtension = useMemo(() => {
    const term = searchTerm?.trim();
    if (!term) return null;
    return highlightTerm(term);
  }, [searchTerm]);

  const extensions = useMemo<Extension[]>(() => {
    const theme = resolvedTheme === "dark" ? githubDark : githubLight;
    const base = EditorView.theme(
      {
        "&": { backgroundColor: "transparent", fontSize: "12px" },
        ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
        ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid hsl(var(--border))" },
        ".cm-activeLineGutter": { backgroundColor: "transparent" },
        ".cm-search-highlight": {
          backgroundColor: "var(--primary, rgba(34,197,94,0.25))",
          color: "inherit",
          borderRadius: "4px",
        },
      },
      { dark: resolvedTheme === "dark" }
    );

    const ex: Extension[] = [
      theme,
      base,
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      foldGutter(),
      indentOnInput(),
      keymap.of(foldKeymap),
      EditorView.lineWrapping,
      yaml(),
    ];
    if (searchExtension) ex.push(searchExtension);
    return ex;
  }, [resolvedTheme, searchExtension, defaultCollapsed]);

  if (!mounted) return null;

  return (
    <TooltipProvider>
      <div className="relative h-full">
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  copied ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-background/80 hover:bg-muted"
                )}
                aria-label="Copy to clipboard"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              {copied ? "Copied!" : "Copy to clipboard"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg bg-background/80 hover:bg-muted"
                aria-label="Collapse all"
                onClick={() => {
                  if (!view) return;
                  requestAnimationFrame(() => foldAll(view));
                }}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              Collapse all
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg bg-background/80 hover:bg-muted"
                aria-label="Expand all"
                onClick={() => {
                  if (!view) return;
                  requestAnimationFrame(() => unfoldAll(view));
                }}
              >
                <Expand className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              Expand all
            </TooltipContent>
          </Tooltip>
        </div>

        <CodeMirror
          value={value}
          theme={resolvedTheme === "dark" ? githubDark : githubLight}
          extensions={extensions}
          height={fullHeight ? "100%" : "24rem"}
          basicSetup={{ lineNumbers: false, foldGutter: false }}
          editable={false}
          readOnly
          aria-label={ariaLabel}
          className="rounded-lg border border-border/60 bg-muted/20 dark:bg-card/40"
          onCreateEditor={(view) => {
            setView(view);
            if (defaultCollapsed) {
              requestAnimationFrame(() => {
                foldAll(view);
              });
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}

const highlightMark = Decoration.mark({ class: "cm-search-highlight" });

function highlightTerm(term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = this.build(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.build(update.view);
        }
      }
      build(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to);
          let match;
          while ((match = regex.exec(text))) {
            const start = from + match.index;
            const end = start + match[0].length;
            builder.add(start, end, highlightMark);
          }
        }
        return builder.finish();
      }
    },
    { decorations: (v) => v.decorations }
  );
}
