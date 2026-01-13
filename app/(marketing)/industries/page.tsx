import type { Metadata } from "next";
import { MarketingAnchor } from "../components/marketing-anchor";
import { Building, Target, Users, Shield, Sparkles, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { 
  AnimatedSystemGrid,
  PulsingNode,
  ParallaxLayer,
} from "@/components/motion";

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

function IndustriesHero() {
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
                <Building className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              </motion.div>
              Industry Solutions
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
            >
              Compliance workflows tailored for<br />
              <span className="relative">
                <span className="text-gradient">regulated industries</span>
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
              Pre-configured frameworks, controls, and audit processes designed for Australian health, disability, and community services.
            </motion.p>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}

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
      <IndustriesHero />

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
