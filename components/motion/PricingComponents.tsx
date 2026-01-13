"use client";

import { motion } from "framer-motion";
import { Check, X, Sparkles, LucideIcon } from "lucide-react";
import Link from "next/link";

// Premium pricing tier card
interface PricingTierCardProps {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  delay?: number;
}

export function PricingTierCard({
  name,
  price,
  cadence,
  description,
  features,
  cta,
  href,
  featured = false,
  delay = 0
}: PricingTierCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, scale: featured ? 1.02 : 1.03 }}
      className={`
        relative rounded-3xl p-8 lg:p-10 h-full flex flex-col
        ${featured 
          ? 'glass-intense border-2 border-primary/30 shadow-premium-2xl' 
          : 'glass-panel-strong shadow-premium-lg'
        }
      `}
    >
      {/* Featured badge */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 glass-panel-strong rounded-full px-5 py-2 text-xs font-bold text-primary border border-primary/30"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Most Popular
        </motion.div>
      )}

      {/* Tier name */}
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
        {name}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: delay + 0.1, type: "spring" }}
            className="text-5xl lg:text-6xl font-bold font-display"
          >
            {price}
          </motion.div>
          {cadence && (
            <div className="text-lg text-muted-foreground">{cadence}</div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground/70 leading-relaxed mb-8">
        {description}
      </p>

      {/* Features list */}
      <div className="flex-1 space-y-4 mb-8">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: delay + 0.2 + (idx * 0.05) }}
            className="flex items-start gap-3 text-sm"
          >
            <div className="mt-0.5 rounded-full bg-primary/20 p-0.5">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <span className="text-foreground/80">{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA button */}
      <Link
        href={href}
        className={`
          block text-center rounded-xl px-6 py-4 font-semibold transition-all
          ${featured 
            ? 'btn btn-primary shadow-premium-lg' 
            : 'btn btn-secondary'
          }
        `}
      >
        {cta}
      </Link>

      {/* Background glow for featured */}
      {featured && (
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 blur-2xl -z-10 opacity-60" />
      )}
    </motion.div>
  );
}

// Comparison feature row
interface ComparisonFeatureProps {
  feature: string;
  starter: boolean;
  pro: boolean;
  enterprise: boolean;
}

export function ComparisonFeature({ feature, starter, pro, enterprise }: ComparisonFeatureProps) {
  const CheckMark = () => <Check className="h-5 w-5 text-primary" />;
  const CrossMark = () => <X className="h-5 w-5 text-muted-foreground/30" />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-4 gap-4 py-4 border-b border-border/20 items-center"
    >
      <div className="text-sm text-foreground/80">{feature}</div>
      <div className="flex justify-center">{starter ? <CheckMark /> : <CrossMark />}</div>
      <div className="flex justify-center">{pro ? <CheckMark /> : <CrossMark />}</div>
      <div className="flex justify-center">{enterprise ? <CheckMark /> : <CrossMark />}</div>
    </motion.div>
  );
}

// Enterprise custom pricing card
export function EnterprisePricingCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="glass-panel-strong rounded-3xl p-10 lg:p-12 shadow-premium-2xl"
    >
      <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            Enterprise Onboarding
          </div>
          
          <h3 className="text-3xl font-bold font-display mb-4">
            Tailored compliance programs
          </h3>
          
          <p className="text-foreground/70 leading-relaxed mb-6">
            We design custom frameworks, white-glove onboarding, and dedicated support 
            for organizations with complex regulatory requirements.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Custom compliance frameworks",
              "Dedicated implementation team",
              "Priority support channel",
              "Org-wide deployment assistance"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-foreground/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/contact"
          className="btn btn-primary text-lg px-10 py-5 whitespace-nowrap shadow-premium-lg"
        >
          Contact Sales
        </Link>
      </div>

      {/* Ambient glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl -z-10 opacity-50" />
    </motion.div>
  );
}

// Add-on feature card
interface AddOnCardProps {
  icon: LucideIcon;
  name: string;
  price: string;
  description: string;
  delay?: number;
}

export function AddOnCard({ icon: Icon, name, price, description, delay = 0 }: AddOnCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="glass-panel rounded-2xl p-6 shadow-premium-md group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="rounded-xl bg-secondary/10 p-3">
          <Icon className="h-6 w-6 text-secondary" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-display">{price}</div>
          <div className="text-xs text-muted-foreground">/month</div>
        </div>
      </div>

      <h4 className="text-lg font-semibold font-display mb-2 group-hover:text-primary transition-colors">
        {name}
      </h4>
      
      <p className="text-sm text-foreground/70 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
