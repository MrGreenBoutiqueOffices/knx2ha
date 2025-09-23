"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Moon, Sun, Laptop } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Avoid SSR hydration mismatch by not rendering icons until mounted
  const current = theme === "system" ? systemTheme : theme;
  const icon = !mounted ? null : theme === "system" ? (
    <Laptop className="h-4 w-4" />
  ) : current === "dark" ? (
    <Moon className="h-4 w-4" />
  ) : (
    <Sun className="h-4 w-4" />
  );

  const nextTheme = () => {
    // Rotate light -> dark -> system -> light
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="cursor-pointer"
            aria-label={`Toggle theme (current: ${theme ?? "system"})`}
            onClick={() => setTheme(nextTheme())}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Theme: {theme ?? "system"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
