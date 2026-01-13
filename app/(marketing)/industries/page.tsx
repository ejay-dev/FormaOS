import type { Metadata } from "next";
import { MarketingAnchor } from "../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Industry Solutions",
  description: "Compliance frameworks for health, disability, community services, and regulated industries.",
  alternates: {
    canonical: `${siteUrl}/industries`,
  },
  openGraph: {
    title: "FormaOS | Industry Solutions", 
    description: "Pre-configured compliance frameworks for Australian health, disability, and community services.",
    type: "website",
    url: `${siteUrl}/industries`,
  },
};

const industries = [
  {
    title: "Disability service providers",
    pain: "NDIS audits, worker screening, complex incident reporting, and continuous improvement obligations.",
    solution:
      "Pre-built NDIS compliance workflows with automated evidence collection and audit-ready reporting.",
  },
  {
    title: "Healthcare & allied health",
    pain: "AHPRA registration, clinical governance, patient safety, and multi-jurisdictional compliance.",
    solution:
      "Integrated health service frameworks covering registration, governance, and safety requirements.",
  },
  {
    title: "Community services",
    pain: "Multiple program obligations, shared evidence, and funding compliance documentation.",
    solution:
      "Standardize controls across programs while maintaining evidence traceability and governance reporting.",
  },
  {
    title: "Regulated professional services",
    pain: "Multi-site governance, professional accreditation, and audit requirements with limited staff.",
    solution:
      "Provide a single compliance system across locations with clear accountability and reporting.",
  },
  {
    title: "Custom frameworks",
    pain: "Non-standard obligations or internal governance requirements with no clear tooling.",
    solution:
      "Configure custom control libraries, evidence types, and reporting outputs inside FormaOS.",
  },
];

export default function IndustriesPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Compliance workflows tailored for<br />
              <span className="text-primary">regulated industries</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
              Pre-configured frameworks, controls, and audit processes designed for Australian health, disability, and community services.
            </p>
          </div>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {industries.map((industry, idx) => (
              <div key={idx} className="bg-background border border-border rounded-xl p-8">
                <h3 className="text-xl font-bold mb-4">{industry.title}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
                      The Challenge
                    </h4>
                    <p className="text-foreground/80">{industry.pain}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
                      Our Solution
                    </h4>
                    <p className="text-foreground/80">{industry.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingAnchor 
        title="Transform your industry compliance"
        subtitle="See how FormaOS works for your sector"
        badge="Request Demo"
      />
    </div>
  );
}
