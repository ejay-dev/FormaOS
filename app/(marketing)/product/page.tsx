import type { Metadata } from "next";
import ProductPageContent from "./ProductPageContent";
import { breadcrumbSchema, aggregateRatingSchema, videoObjectSchema } from "@/lib/seo";

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.formaos.com.au";

export const metadata: Metadata = {
  title: "Compliance Operating System Platform — FormaOS",
  description:
    "See how FormaOS connects tasks, evidence, audit trails, and compliance reporting into a single defensible workflow for regulated operations.",
  alternates: {
    canonical: `${siteUrl}/product`,
  },
  openGraph: {
    title: "Compliance Operating System Platform | FormaOS",
    description:
      "See how FormaOS links policies, tasks, evidence, and audit readiness into a defensible compliance workflow.",
    type: "website",
    url: `${siteUrl}/product`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Compliance Operating System Platform | FormaOS",
    description:
      "See how FormaOS links policies, tasks, evidence, and audit readiness into a defensible compliance workflow.",
  },
};

export default function ProductPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Product", path: "/product" },
            ]),
            aggregateRatingSchema(),
            videoObjectSchema({
              name: "FormaOS — Compliance Operating System Demo",
              description:
                "See how FormaOS connects policies, tasks, evidence, and audit readiness into a single defensible compliance workflow for regulated organizations.",
              thumbnailUrl: "/og-image.png",
              uploadDate: "2025-01-01",
              duration: "PT3M",
            }),
          ]),
        }}
      />
      <ProductPageContent />
    </>
  );
}
