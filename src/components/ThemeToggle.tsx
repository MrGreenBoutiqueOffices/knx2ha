"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Moon, Sun, Laptop } from "lucide-react";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

type ToggleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  ariaLabel?: string;
};

export default function ThemeToggle({ variant = "outline", size = "icon", className, ariaLabel }: ToggleProps) {
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
            variant={variant}
            size={size}
            className={cn("cursor-pointer", className)}
            aria-label={ariaLabel ?? `Toggle theme (current: ${theme ?? "system"})`}
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
