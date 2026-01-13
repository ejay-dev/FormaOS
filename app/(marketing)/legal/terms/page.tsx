import type { Metadata } from "next";
import { MarketingAnchor } from "../../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Terms of Service",
  description: "Terms of service for the FormaOS compliance platform.",
  alternates: {
    canonical: `${siteUrl}/legal/terms`,
  },
  openGraph: {
    title: "FormaOS | Terms of Service",
    description: "Terms of service for the FormaOS compliance platform.",
    type: "website",
    url: `${siteUrl}/legal/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 pt-16 md:pt-24">
      <div className="space-y-6 mk-fade-up mk-parallax-slow">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Legal</div>
        <h1 className="text-4xl font-semibold font-[var(--font-display)]">Terms of Service</h1>
        <p className="text-sm text-slate-300">
          FormaOS is a compliance operating system designed for regulated organizations. These terms establish the framework for responsible platform usage, data integrity, and shared accountability between FormaOS and your organization.
        </p>
        <MarketingAnchor
          title="Usage Governance Layer"
          subtitle="Account access, audit logging, and evidence obligations."
          badge="Legal guardrails"
          accent="99 102 241"
          compact
        />
        <div className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6 text-sm text-slate-300 space-y-4">
          <p>
            Customers are responsible for the accuracy of information submitted to FormaOS and for ensuring their
            users comply with internal governance standards. FormaOS provides tooling and reporting but does not
            replace regulatory obligations.
          </p>
          <p>
            Access to the platform is subject to account permissions, audit logging, and evidence retention policies.
            Unauthorized use may result in suspension or termination.
          </p>
          <p>
            The service is provided on an as-is basis. To the extent permitted by law, FormaOS disclaims warranties of
            merchantability or fitness for a particular purpose and limits liability for indirect or consequential
            damages arising from platform use.
          </p>
          <p>
            Governing law and venue will be set out in customer agreements or statements of work. If you are unsure of
            your applicable terms, contact legal@formaos.com for clarification.
          </p>
          <p>
            For contractual questions, contact legal@formaos.com.
          </p>
        </div>
      </div>
    </div>
  );
}
