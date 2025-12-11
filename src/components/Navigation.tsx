"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-linear-to-r from-background via-background to-muted/40 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
            <Home className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="block text-base font-bold tracking-tight text-foreground">KNX2HOME</span>
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
                href="https://github.com/MrGreenBoutiqueOffices/knx2home"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="flex items-center gap-2"
            >
              <FaGithub className="h-4 w-4" />
              <span className="text-xs font-semibold">GitHub</span>
            </a>
          </Button>

          {/* Theme toggle - hidden on mobile, visible on desktop */}
          <div className="hidden md:block">
            <ThemeToggle ariaLabel="Thema kiezen" />
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden px-2"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[340px] p-0 flex flex-col">
              <SheetTitle className="sr-only">Navigatie Menu</SheetTitle>

              {/* Header */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
                <div className="rounded-md bg-primary/10 p-1.5">
                  <Home className="h-4 w-4 text-primary" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-base">KNX2HOME</span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
                <div className="space-y-1">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Home className="h-4 w-4" strokeWidth={2.5} />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/tool"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/tool"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Converter</span>
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === "/about"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>About</span>
                  </Link>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-3">
                  <div className="h-px bg-border/50" />
                  <div className="flex items-center justify-between px-3">
                    <a
                      href="https://github.com/MrGreenBoutiqueOffices/knx2home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="GitHub Repository"
                    >
                      <FaGithub className="h-3.5 w-3.5" />
                      <span>GitHub</span>
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                    <ThemeToggle ariaLabel="Thema kiezen" />
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
