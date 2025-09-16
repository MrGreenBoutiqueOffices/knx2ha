"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function CodePanel({
  value,
  ariaLabel,
}: {
  value: string;
  ariaLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Gekopieerd", {
        description: "YAML is naar het klembord gekopieerd.",
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Kopiëren mislukt", {
        description: "Kon de tekst niet kopiëren.",
      });
    }
  }

  return (
    <TooltipProvider>
      <div className="relative">
        <div className="absolute right-2 top-2 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Kopieer"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={6}>
              Kopieer naar klembord
            </TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="h-[28rem] rounded-lg border bg-muted/40">
          <pre
            aria-label={ariaLabel}
            className="whitespace-pre-wrap p-4 text-xs"
          >
            {value}
          </pre>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
