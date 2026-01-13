import type { Metadata } from "next";
import { StoryHero, StoryContent } from "./StoryPageContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "Our Story | FormaOS",
  description:
    "Why FormaOS exists and how we are building a compliance operating system for regulated teams.",
  alternates: {
    canonical: `${siteUrl.replace(/\/$/, "")}/our-story`,
  },
  openGraph: {
    title: "Our Story | FormaOS",
    description:
      "Founder-led story of how FormaOS was built for regulated teams and audit-ready operations.",
    type: "article",
    url: `${siteUrl.replace(/\/$/, "")}/our-story`,
  },
};

export default function OurStoryPage() {
  return (
    <div>
      <StoryHero />
      <StoryContent />
    </div>
  );
}
