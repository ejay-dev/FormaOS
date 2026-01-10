import "./globals.css";
import type { Metadata } from "next";
import CommandPalette from "@/components/command-palette";

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
    <html lang="en" className="font-sans" suppressHydrationWarning>
      {/* Use HSL var-based utilities for background/text so theme tokens drive visuals */}
      <body className="min-h-screen bg-[#05080f] text-slate-100 antialiased">
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
