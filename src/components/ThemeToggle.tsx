"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun, Laptop } from "lucide-react";

type ToggleProps = {
  className?: string;
  ariaLabel?: string;
};

export default function ThemeToggle({ className, ariaLabel }: ToggleProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const nextTheme = () => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  const icon =
    theme === "system" ? (
      <Laptop className="h-4 w-4" />
    ) : current === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "h-9 w-9 border-border/70 bg-card/80 text-foreground transition-colors hover:border-primary/50 hover:bg-muted/70 hover:text-primary",
        className
      )}
      aria-label={ariaLabel ?? `Toggle theme (current: ${theme ?? "system"})`}
      onClick={() => setTheme(nextTheme())}
    >
      {icon}
    </Button>
  );
}
