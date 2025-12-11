"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-gradient-to-r from-background via-background to-muted/40 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
            <Home className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="block text-base font-bold tracking-tight text-foreground">KNX2HA</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                Beta
              </span>
            </div>
            <span className="block text-xs text-muted-foreground">Convert KNX projects to HA in minutes</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/tool"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/tool"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            Converter
          </Link>
          <Link
            href="/about"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/about"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex border-border/60 text-foreground hover:border-primary/50"
            asChild
          >
            <a
              href="https://github.com/MrGreenBoutiqueOffices/knx2ha"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="flex items-center gap-2"
            >
              <FaGithub className="h-4 w-4" />
              <span className="text-xs font-semibold">GitHub</span>
            </a>
          </Button>
          <ThemeToggle ariaLabel="Thema kiezen" />
        </div>
      </div>
    </header>
  );
}
