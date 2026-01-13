import type { Metadata } from "next";
import { MarketingAnchor } from "./components/marketing-anchor";
import { HomeClientMarker } from "./components/home-client-marker";
import { HomePageClient } from "./components/home-page-client";

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
      
      {/* Client-side rendered content with animations */}
      <HomePageClient />

      <MarketingAnchor 
        title="Start your compliance transformation"
        subtitle="Move from tracking to enforcement with FormaOS"
        badge="Platform Access"
      />
    </div>
  );
}
