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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      whileHover={{ y: -12, scale: featured ? 1.02 : 1.03 }}
      className={`
        relative rounded-3xl p-8 lg:p-10 h-full flex flex-col overflow-hidden group
        ${featured 
          ? 'glass-intense border-2 border-primary/30 shadow-premium-2xl' 
          : 'glass-panel-strong shadow-premium-lg border border-white/5'
        }
      `}
    >
      {/* Ambient glow layers */}
      <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${featured ? 'from-primary/25 via-secondary/15 to-accent/25' : 'from-primary/10 via-transparent to-secondary/10'} blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Featured badge */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 glass-panel-strong rounded-full px-5 py-2 text-xs font-bold text-primary border border-primary/30 shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </motion.div>
          Most Popular
        </motion.div>
      )}

      {/* Tier name */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.1 }}
        className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2"
      >
        {name}
      </motion.div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: delay + 0.15, type: "spring", stiffness: 200 }}
            className={`text-5xl lg:text-6xl font-bold font-display ${featured ? 'text-gradient' : ''}`}
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
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: delay + 0.2 + (idx * 0.05) }}
            className="flex items-start gap-3 text-sm group/feature"
          >
            <div className="mt-0.5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 p-1 group-hover/feature:from-primary/50 group-hover/feature:to-primary/20 transition-all duration-300">
              <Check className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-foreground/80 group-hover/feature:text-foreground transition-colors duration-300">{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          href={href}
          className={`
            block text-center rounded-xl px-6 py-4 font-semibold transition-all relative overflow-hidden
            ${featured 
              ? 'btn btn-primary shadow-premium-lg' 
              : 'btn btn-secondary hover:border-primary/30'
            }
          `}
        >
          {cta}
        </Link>
      </motion.div>

      {/* Background glow for featured */}
      {featured && (
        <>
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 blur-2xl -z-10 opacity-60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/10 blur-3xl -z-10" />
        </>
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
  const CheckMark = () => (
    <motion.div
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-1"
    >
      <Check className="h-4 w-4 text-primary" />
    </motion.div>
  );
  const CrossMark = () => <X className="h-5 w-5 text-muted-foreground/20" />;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-b border-border/10 items-center transition-colors duration-300 rounded-lg px-2 -mx-2"
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      className="relative glass-panel-strong rounded-3xl p-10 lg:p-14 shadow-premium-2xl overflow-hidden group"
    >
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Ambient corner glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center relative">
        <div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: delay + 0.1 }}
            className="inline-flex items-center gap-2.5 glass-panel-strong rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider mb-6 border border-primary/20"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
            Enterprise Onboarding
          </motion.div>
          
          <h3 className="text-3xl lg:text-4xl font-bold font-display mb-5 leading-tight">
            Tailored compliance programs
          </h3>
          
          <p className="text-foreground/70 leading-relaxed mb-8 text-lg">
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
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: delay + 0.2 + (idx * 0.05) }}
                className="flex items-center gap-3 text-sm group/item"
              >
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-secondary group-hover/item:scale-125 transition-transform duration-300" />
                <span className="text-foreground/80 group-hover/item:text-foreground transition-colors duration-300">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/contact"
            className="btn btn-primary text-lg px-12 py-5 whitespace-nowrap shadow-premium-xl relative overflow-hidden group/btn"
          >
            <span className="relative z-10">Contact Sales</span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
          </Link>
        </motion.div>
      </div>

      {/* Background ambient glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-2xl -z-10 opacity-50" />
      <div className="absolute bottom-0 left-1/4 w-1/2 h-32 bg-primary/5 blur-3xl -z-10" />
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
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative glass-panel rounded-2xl p-7 shadow-premium-md group cursor-pointer overflow-hidden border border-white/5"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-secondary/30 transition-colors duration-300" />

      <div className="relative flex items-start justify-between mb-5">
        <motion.div 
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
          className="rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 p-3 border border-secondary/10 group-hover:border-secondary/30 transition-colors duration-300"
        >
          <Icon className="h-6 w-6 text-secondary group-hover:text-secondary transition-colors duration-300" />
        </motion.div>
        <div className="text-right">
          <div className="text-2xl font-bold font-display text-gradient">{price}</div>
          <div className="text-xs text-muted-foreground">/month</div>
        </div>
      </div>

      <h4 className="relative text-lg font-semibold font-display mb-2 group-hover:text-primary transition-colors duration-300">
        {name}
      </h4>
      
      <p className="relative text-sm text-foreground/70 leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
        {description}
      </p>
    </motion.div>
  );
}
