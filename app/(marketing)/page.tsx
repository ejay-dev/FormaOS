import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Lock,
  Activity,
  ClipboardCheck,
  ArrowUpRight,
} from "lucide-react";
import { MarketingAnchor } from "./components/marketing-anchor";
import { HomeClientMarker } from "./components/home-client-marker";
import { HomePageContent } from "./components/HomePageContent";
import { CinematicHero } from "./components/CinematicHero";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Enterprise Compliance Operating System",
  description:
    "FormaOS is the enterprise compliance operating system for regulated industries. Align controls, evidence, tasks, and audits in one command center.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "FormaOS | Enterprise Compliance Operating System",
    description:
      "Enterprise compliance platform for NDIS, healthcare, and regulated operations.",
    type: "website",
    url: siteUrl,
  },
};

export default function HomePage() {
  return (
    <div className="relative">
      <HomeClientMarker />

      {/* Cinematic Hero with 3D modules */}
      <CinematicHero />

      {/* Rest of the content with motion */}
      <HomePageContent />

      <MarketingAnchor 
        title="Start your compliance transformation"
        subtitle="Move from tracking to enforcement with FormaOS"
        badge="Platform Access"
      />
    </div>
  );
}
