"use client";

import Link from "next/link";
import { Home, Github, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                KNX2HA
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              KNX to Home Assistant converter. Fast, local, and open source.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/tool"
                  className="transition-colors hover:text-primary"
                >
                  Converter tool
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/MrGreenBoutiqueOffices/knx2ha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/MrGreenBoutiqueOffices/knx2ha/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Release notes
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.home-assistant.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Home Assistant
                </a>
              </li>
              <li>
                <a
                  href="https://www.knx.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  KNX Association
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/MrGreenBoutiqueOffices/knx2ha/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Report Issues
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/MrGreenBoutiqueOffices/knx2ha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} KNX2HA. Open source project.
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for the Home Assistant community
          </p>
        </div>
      </div>
    </footer>
  );
}
