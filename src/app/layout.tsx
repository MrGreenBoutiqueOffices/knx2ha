import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ThemeProvider from "@/components/theme-provider";
import VersionTag from "@/components/VersionTag";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KNX → HA",
  description: "Client-side KNX parser",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
          <div className="fixed bottom-3 right-3 z-50 opacity-70 hover:opacity-100 transition-opacity hidden sm:block">
            <VersionTag />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
