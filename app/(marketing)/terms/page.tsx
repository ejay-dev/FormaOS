import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms",
  description: 'Terms and conditions for the FormaOS compliance operating system. Framework for responsible platform usage, data integrity, and shared accountability.',
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
