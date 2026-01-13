import type { Metadata } from "next";
import Link from "next/link";
import { MarketingAnchor } from "../components/marketing-anchor";
import { Shield, Target, Users, Sparkles, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { 
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer,
} from "@/components/motion";

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

function SecurityHero() {
  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Animated system grid layer */}
      <div className="absolute inset-0 opacity-40 sm:opacity-60">
        <AnimatedSystemGrid />
      </div>
      
      {/* Pulsing nodes - hidden on mobile */}
      <div className="hidden sm:block">
        <PulsingNode x="12%" y="25%" delay={0} color="rgb(139, 92, 246)" />
        <PulsingNode x="88%" y="35%" delay={0.5} />
        <PulsingNode x="18%" y="75%" delay={1} />
        <PulsingNode x="82%" y="85%" delay={1.5} color="rgb(6, 182, 212)" />
      </div>
      
      {/* Radial gradient overlays - reduced on mobile */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[300px] sm:h-[600px] w-[300px] sm:w-[600px] rounded-full bg-secondary/20 blur-[60px] sm:blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[250px] sm:h-[500px] w-[250px] sm:w-[500px] rounded-full bg-primary/15 blur-[50px] sm:blur-[100px]" />
      
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <ParallaxLayer speed={0.3}>
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 sm:gap-2.5 glass-intense rounded-full px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 border border-secondary/30"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Security & Compliance
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Enterprise security built for<br />
              <span className="relative">
                <span className="text-gradient">regulated environments</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-secondary via-primary to-accent rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto"
            >
              Security architecture designed for organizations that answer to regulators. Immutable audit logs, role-based access, and evidence encryption.
            </motion.p>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

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
      <SecurityHero />

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
