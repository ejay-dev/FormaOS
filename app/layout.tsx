import "./globals.css";
import type { Metadata } from "next";
import CommandPalette from "@/components/command-palette";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FormaOS | Enterprise Compliance",
  description:
    "The professional operating system for modern compliance and risk management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      {/* Use HSL var-based utilities for background/text so theme tokens drive visuals */}
      <body className="min-h-screen bg-[#05080f] text-slate-100 antialiased">
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
