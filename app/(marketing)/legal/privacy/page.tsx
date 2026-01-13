import type { Metadata } from "next";
import { MarketingAnchor } from "../../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Privacy Policy",
  description: "Privacy policy for the FormaOS compliance platform.",
  alternates: {
    canonical: `${siteUrl}/legal/privacy`,
  },
  openGraph: {
    title: "FormaOS | Privacy Policy",
    description: "Privacy policy for the FormaOS compliance platform.",
    type: "website",
    url: `${siteUrl}/legal/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 pt-16 md:pt-24">
      <div className="space-y-6 mk-fade-up mk-parallax-slow">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Privacy</div>
        <h1 className="text-4xl font-semibold font-[var(--font-display)]">Privacy Policy</h1>
        <p className="text-sm text-slate-300">
          FormaOS is designed for regulated organizations that require enterprise-grade data protection, audit-ready documentation, and operational trust. This policy explains our approach to safeguarding your information.
        </p>
        <MarketingAnchor
          title="Data Protection Layer"
          subtitle="Org-scoped security and audit-grade traceability."
          badge="Privacy guard"
          accent="16 185 129"
          compact
        />
        <div className="mk-card mk-tilt mk-depth-1 rounded-2xl p-6 text-sm text-slate-300 space-y-4">
          <p>
            FormaOS processes data on behalf of regulated organizations. We collect account details, operational data,
            and audit evidence required to deliver compliance services. Data is stored in secure infrastructure with
            access controls and audit logging.
          </p>
          <p>
            We do not sell customer data. Access is limited to authorized personnel and governed by contractual and
            regulatory obligations. Customers remain responsible for the data they upload and the policies they configure.
          </p>
          <p>
            Data is retained for as long as a customer account is active or as required to meet legal and audit
            obligations. Customers may request data exports or deletion subject to regulatory retention requirements.
          </p>
          <p>
            FormaOS uses industry-standard security measures, including encryption in transit and role-based access
            controls, to protect customer information. Subprocessors are assessed to ensure they meet confidentiality
            and security obligations.
          </p>
          <p>
            For privacy questions, contact privacy@formaos.com.
          </p>
        </div>
      </div>
    </div>
  );
}
