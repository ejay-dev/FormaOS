import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms and conditions for using FormaOS.",
  alternates: {
    canonical: `${siteUrl}/legal/terms`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function TermsRedirectPage() {
  permanentRedirect("/legal/terms");
}
