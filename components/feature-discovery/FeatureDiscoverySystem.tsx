/**
 * Feature Discovery System
 * Helps users discover underutilized features within the app
 */

'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Lightbulb,
  ChevronRight,
  Calendar,
  Users,
  FileCheck,
  Activity,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  industry?: string[]; // Show only to specific industries
  roles?: string[]; // Show only to specific roles
  newFeature?: boolean; // Mark as "New" badge
  priority?: 'high' | 'medium' | 'low';
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    id: 'staff-portal',
    title: 'Staff Portal',
    description:
      'Front-line workers: Access your tasks, patients, and shifts in one place—no admin clutter.',
    href: '/app/staff',
    icon: Users,
    industry: ['healthcare', 'ndis', 'aged_care'],
    roles: ['staff'],
    newFeature: true,
    priority: 'high',
  },
  {
    id: 'shift-tracking',
    title: 'Shift Tracking',
    description:
      'Clock in/out for shifts with automatic audit trails. Shift data becomes compliance evidence.',
    href: '/app/patients',
    icon: Calendar,
    industry: ['healthcare', 'aged_care', 'ndis'],
    roles: ['staff', 'compliance_officer', 'manager'],
    newFeature: true,
    priority: 'high',
  },
  {
    id: 'visit-scheduling',
    title: 'Visit Scheduling',
    description:
      'Schedule service visits and appointments. Every visit logged becomes audit evidence automatically.',
    href: '/app/visits',
    icon: Calendar,
    industry: ['ndis', 'healthcare', 'aged_care'],
    roles: ['compliance_officer', 'manager', 'staff'],
    newFeature: true,
    priority: 'high',
  },
  {
    id: 'incident-workflows',
    title: 'Incident Investigation',
    description:
      'Log adverse events with severity classification, track investigations, and export regulator-ready reports.',
    href: '/app/patients',
    icon: Activity,
    industry: ['healthcare', 'ndis', 'aged_care'],
    roles: ['compliance_officer', 'manager', 'owner'],
    priority: 'high',
  },
  {
    id: 'evidence-approval',
    title: 'Evidence Approval Workflow',
    description:
      'Review and approve evidence before it counts toward compliance. Complete approval audit trail included.',
    href: '/app/vault/review',
    icon: FileCheck,
    industry: [],
    roles: ['compliance_officer', 'manager', 'owner'],
    priority: 'medium',
  },
  {
    id: 'multi-site',
    title: 'Multi-Site Management',
    description:
      'Manage compliance across multiple sites, facilities, or business units with entity-level filtering.',
    href: '/app',
    icon: Shield,
    industry: [],
    roles: ['owner', 'admin'],
    priority: 'medium',
  },
];

interface FeatureDiscoveryBannerProps {
  organizationIndustry?: string | null;
  userRole?: string | null;
  onDismiss?: (featureId: string) => void;
}

export function FeatureDiscoveryBanner({
  organizationIndustry,
  userRole,
  onDismiss,
}: FeatureDiscoveryBannerProps) {
  const [dismissedFeatures, setDismissedFeatures] = useState<string[]>([]);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  // Load dismissed features from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('formaos_dismissed_features');
    if (dismissed) {
      setDismissedFeatures(JSON.parse(dismissed));
    }
  }, []);

  // Filter features based on industry and role
  const relevantFeatures = FEATURE_HIGHLIGHTS.filter((feature) => {
    if (dismissedFeatures.includes(feature.id)) return false;
    if (
      feature.industry &&
      feature.industry.length > 0 &&
      organizationIndustry
    ) {
      if (!feature.industry.includes(organizationIndustry)) return false;
    }
    if (feature.roles && feature.roles.length > 0 && userRole) {
      if (!feature.roles.includes(userRole.toLowerCase())) return false;
    }
    return true;
  });

  const currentFeature = relevantFeatures[currentFeatureIndex];

  const handleDismiss = () => {
    if (!currentFeature) return;

    const newDismissed = [...dismissedFeatures, currentFeature.id];
    setDismissedFeatures(newDismissed);
    localStorage.setItem(
      'formaos_dismissed_features',
      JSON.stringify(newDismissed),
    );

    if (onDismiss) {
      onDismiss(currentFeature.id);
    }

    // Move to next feature if available
    if (currentFeatureIndex < relevantFeatures.length - 1) {
      setCurrentFeatureIndex(currentFeatureIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentFeatureIndex < relevantFeatures.length - 1) {
      setCurrentFeatureIndex(currentFeatureIndex + 1);
    } else {
      setCurrentFeatureIndex(0);
    }
  };

  if (relevantFeatures.length === 0 || !currentFeature) return null;

  const Icon = currentFeature.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentFeature.id}
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mb-4"
      >
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Did you know?
                </span>
                {currentFeature.newFeature && (
                  <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-xs font-bold text-foreground">
                    NEW
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {currentFeature.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentFeature.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={currentFeature.href}
                className="group flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-surface-3 border border-border hover:border-border text-xs font-medium text-foreground transition-all"
              >
                <span>Explore</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {relevantFeatures.length > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-edge-2">
              <div className="flex items-center gap-1">
                {relevantFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeatureIndex(index)}
                    className={`h-1 rounded-full transition-all ${
                      index === currentFeatureIndex
                        ? 'w-6 bg-primary'
                        : 'w-1 bg-muted hover:bg-surface-3'
                    }`}
                    aria-label={`Go to feature ${index + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wide transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Feature Card for highlighting specific capabilities
 * Use in dashboard or module landing pages
 */
interface FeatureCardProps {
  feature: FeatureHighlight;
  variant?: 'compact' | 'expanded';
}

export function FeatureCard({
  feature,
  variant = 'expanded',
}: FeatureCardProps) {
  const Icon = feature.icon;

  if (variant === 'compact') {
    return (
      <a
        href={feature.href}
        className="group block p-4 rounded-xl bg-surface-1 border border-border hover:border-primary transition-all motion-safe:hover:scale-105"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h4>
              {feature.newFeature && (
                <span className="px-1.5 py-0.5 rounded-full bg-muted border border-border text-[9px] font-bold text-foreground">
                  NEW
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {feature.description}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </a>
    );
  }

  return (
    <a
      href={feature.href}
      className="group block p-6 rounded-2xl bg-surface-1 border border-border hover:border-primary transition-all motion-safe:hover:scale-105 hover:shadow-xl"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {feature.title}
            </h4>
            {feature.newFeature && (
              <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-xs font-bold text-foreground">
                NEW
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
        <span>Learn more</span>
        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </a>
  );
}

/**
 * Industry-Specific Feature Grid
 * Shows relevant features based on organization industry
 */
interface IndustryFeatureGridProps {
  industry?: string | null;
  userRole?: string | null;
}

export function IndustryFeatureGrid({
  industry,
  userRole,
}: IndustryFeatureGridProps) {
  const relevantFeatures = FEATURE_HIGHLIGHTS.filter((feature) => {
    if (feature.industry && feature.industry.length > 0 && industry) {
      if (!feature.industry.includes(industry)) return false;
    }
    if (feature.roles && feature.roles.length > 0 && userRole) {
      if (!feature.roles.includes(userRole.toLowerCase())) return false;
    }
    return true;
  }).filter((f) => f.priority === 'high'); // Show only high priority features

  if (relevantFeatures.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-bold text-foreground">
          Features for Your Industry
        </h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relevantFeatures.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} variant="compact" />
        ))}
      </div>
    </div>
  );
}
