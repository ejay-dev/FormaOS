import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Security & Compliance",
  description: "Understand FormaOS security architecture, audit logging, and compliance safeguards.",
  alternates: {
    canonical: `${siteUrl}/security`,
  },
  openGraph: {
    title: "FormaOS | Security & Compliance",
    description: "Security architecture, audit logging, and access control designed for regulated operations.",
    type: "website",
    url: `${siteUrl}/security`,
  },
};

const safeguards = [
  {
    title: "Tenant isolation",
    description: "Every record is scoped to an organization with strict RLS enforcement and access controls.",
  },
  {
    title: "Audit-grade logging",
    description: "Immutable audit events capture who did what, when, and why across compliance actions.",
  },
  {
    title: "Role-based access",
    description: "Segregation of duties enforced at every level with granular permission systems.",
  },
  {
    title: "Evidence encryption",
    description: "All sensitive compliance artifacts encrypted at rest and in transit.",
  },
  {
    title: "Compliance gates",
    description: "Automated checks prevent unsafe actions that could compromise audit integrity.",
  },
  {
    title: "Chain of custody",
    description: "Verifiable evidence trails from creation to export for forensic audit defense.",
  },
];

export default function SecurityPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Enterprise security built for<br />
              <span className="text-primary">regulated environments</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
              Security architecture designed for organizations that answer to regulators. Immutable audit logs, role-based access, and evidence encryption.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for compliance-first organizations</h2>
            <p className="text-lg text-muted-foreground">
              Every security control designed to support audit defense and regulatory requirements
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {safeguards.map((feature, idx) => (
              <div key={idx} className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-foreground/80">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-16 bg-background/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Security architecture</h2>
            <p className="text-lg text-muted-foreground">
              Defense in depth with compliance-grade controls
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Perimeter", features: ["WAF protection", "DDoS mitigation", "TLS 1.3 encryption"] },
              { title: "Application", features: ["Role-based access", "Session management", "Input validation"] },
              { title: "Data", features: ["Encryption at rest", "Field-level encryption", "Secure backup"] },
              { title: "Audit", features: ["Immutable logs", "Real-time monitoring", "Compliance reporting"] }
            ].map((layer, idx) => (
              <div key={idx} className="bg-background border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">{layer.title}</h3>
                <ul className="space-y-2">
                  {layer.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="text-sm text-foreground/80 flex items-center">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingAnchor 
        title="Ready for regulatory scrutiny?"
        subtitle="See how FormaOS protects your compliance data"
        badge="Security Overview"
      />
    </div>
  );
}
