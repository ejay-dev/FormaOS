/**
 * Industry-Specific Onboarding Enhancement
 * Highlights relevant features based on selected industry during onboarding
 */

'use client';

import {
  Calendar,
  Users,
  FileCheck,
  Activity,
  Shield,
  Clock,
  MapPin,
  Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface IndustryFeatureHighlight {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  route: string;
}

interface IndustryOnboardingConfig {
  industry: string;
  displayName: string;
  color: string;
  gradient: string;
  features: IndustryFeatureHighlight[];
  quickWins: string[];
}

const INDUSTRY_CONFIGS: Record<string, IndustryOnboardingConfig> = {
  ndis: {
    industry: 'ndis',
    displayName: 'NDIS & Disability Services',
    color: 'from-pink-500 to-rose-500',
    gradient: 'from-pink-500/20 to-rose-500/20',
    features: [
      {
        icon: Users,
        title: 'Participant Management',
        description:
          'Track participants with care status, risk levels, and emergency flags. Every interaction becomes compliance evidence.',
        route: '/app/patients',
      },
      {
        icon: Calendar,
        title: 'Visit Scheduling',
        description:
          'Schedule service delivery visits with automatic audit trails. No double entry—visit logs become compliance evidence.',
        route: '/app/visits',
      },
      {
        icon: Activity,
        title: 'Incident Investigation',
        description:
          'Log and investigate incidents with severity classification. Regulatory reporting-ready.',
        route: '/app/patients',
      },
      {
        icon: FileCheck,
        title: 'NDIS Practice Standards 1-8',
        description:
          'Pre-configured controls aligned to all 8 NDIS Practice Standards. Start auditing in minutes.',
        route: '/app/dashboard',
      },
      {
        icon: Shield,
        title: 'Worker Screening Tracking',
        description:
          'Track NDIS worker screening clearances with automatic expiry reminders.',
        route: '/app/registers',
      },
      {
        icon: Heart,
        title: 'Staff Portal',
        description:
          'Front-line workers get their own dashboard: tasks, participants, shifts. No admin clutter.',
        route: '/app/staff',
      },
    ],
    quickWins: [
      'Map NDIS Practice Standards to your services in 15 minutes',
      'Start logging participant visits with automatic evidence capture',
      'Set up worker screening expiry reminders',
      'Create incident response workflows',
    ],
  },
  healthcare: {
    industry: 'healthcare',
    displayName: 'Healthcare & Medical',
    color: 'from-blue-500 to-cyan-500',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    features: [
      {
        icon: Users,
        title: 'Patient Management',
        description:
          'Complete patient records with risk stratification, care status tracking, and clinical episode management.',
        route: '/app/patients',
      },
      {
        icon: FileCheck,
        title: 'Progress Notes with Sign-Off',
        description:
          'Clinical documentation with supervisor approval workflows. Signed notes become audit evidence automatically.',
        route: '/app/progress-notes',
      },
      {
        icon: Clock,
        title: 'Shift Tracking',
        description:
          'Staff clock in/out for shifts with audit trails. Workforce compliance documentation automated.',
        route: '/app/staff',
      },
      {
        icon: Activity,
        title: 'Clinical Incident Management',
        description:
          'Capture adverse events with SAC ratings, investigations, corrective actions, and AHPRA reporting workflows.',
        route: '/app/patients',
      },
      {
        icon: Shield,
        title: 'Credential Tracking (AHPRA, etc.)',
        description:
          'Track practitioner registrations, immunizations, and mandatory training with renewal reminders.',
        route: '/app/registers',
      },
      {
        icon: Heart,
        title: 'Staff Portal',
        description:
          'Clinicians access their tasks, patients, and shifts without navigating admin interfaces.',
        route: '/app/staff',
      },
    ],
    quickWins: [
      'Configure NSQHS Standards controls for your practice',
      'Start capturing progress notes as compliance evidence',
      'Set up AHPRA registration expiry tracking',
      'Create clinical incident investigation workflows',
    ],
  },
  aged_care: {
    industry: 'aged_care',
    displayName: 'Aged Care',
    color: 'from-emerald-500 to-teal-500',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    features: [
      {
        icon: Users,
        title: 'Resident Management',
        description:
          'Track residents with care plans, risk levels, medications, and episode tracking. HIPAA-aligned design.',
        route: '/app/patients',
      },
      {
        icon: Clock,
        title: 'Shift Tracking & Rostering',
        description:
          'Staff clock in/out with resident assignments. Safe staffing documentation automated.',
        route: '/app/staff',
      },
      {
        icon: Calendar,
        title: 'Service Logs',
        description:
          'Document care delivery services with automatic compliance evidence generation.',
        route: '/app/visits',
      },
      {
        icon: Activity,
        title: 'Incident & Medication Management',
        description:
          'Log incidents, medication errors, and falls with investigation tracking and corrective actions.',
        route: '/app/patients',
      },
      {
        icon: FileCheck,
        title: 'Quality Standards Compliance',
        description:
          'Pre-configured controls for Aged Care Quality Standards with evidence mapping.',
        route: '/app/dashboard',
      },
      {
        icon: Heart,
        title: 'Staff Portal',
        description:
          'Care workers access their tasks, residents, and shifts—no admin complexity.',
        route: '/app/staff',
      },
    ],
    quickWins: [
      'Map Aged Care Quality Standards to your facility operations',
      'Start shift tracking for safe staffing documentation',
      'Set up incident response and investigation workflows',
      'Configure staff credential and training expiry tracking',
    ],
  },
  default: {
    industry: 'default',
    displayName: 'General Compliance',
    color: 'from-indigo-500 to-purple-500',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    features: [
      {
        icon: FileCheck,
        title: 'Evidence Vault',
        description:
          'Secure storage with verification workflows. Every artifact reviewed before counting toward compliance.',
        route: '/app/vault',
      },
      {
        icon: Shield,
        title: 'Multi-Framework Compliance',
        description:
          'Map controls to ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, and CIS Controls simultaneously.',
        route: '/app/dashboard',
      },
      {
        icon: Activity,
        title: 'Automation Engine',
        description:
          '12 workflow triggers: evidence expiry, policy reviews, control failures, task overdue, and more.',
        route: '/app/workflows',
      },
      {
        icon: Users,
        title: 'Team Management',
        description:
          'Role-based access control with 4 roles, 20+ permissions, and organization isolation.',
        route: '/app/team',
      },
      {
        icon: MapPin,
        title: 'Multi-Site Support',
        description:
          'Manage compliance across multiple sites, facilities, or business units with entity-level filtering.',
        route: '/app',
      },
      {
        icon: FileCheck,
        title: 'Immutable Audit Trail',
        description:
          'Every action logged with before/after state. Complete traceability for auditors.',
        route: '/app/audit',
      },
    ],
    quickWins: [
      'Select your compliance frameworks (ISO, SOC 2, GDPR, etc.)',
      'Import or create your first policy',
      'Set up automation triggers for evidence expiry',
      'Invite your compliance team with role-based permissions',
    ],
  },
};

interface IndustryOnboardingFeaturesProps {
  industry?: string | null;
  onFeatureClick?: (route: string) => void;
}

export function IndustryOnboardingFeatures({
  industry,
  onFeatureClick,
}: IndustryOnboardingFeaturesProps) {
  const config =
    INDUSTRY_CONFIGS[industry || 'default'] || INDUSTRY_CONFIGS.default;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.gradient} border border-white/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-medium text-white">
              {config.displayName}
            </span>
          </div>
          <h2
            className={`text-3xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent mb-3`}
          >
            Features Built for Your Industry
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            These features are ready to use right now. Click any card to get
            started.
          </p>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.a
              key={feature.title}
              href={feature.route}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              onClick={(e) => {
                if (onFeatureClick) {
                  e.preventDefault();
                  onFeatureClick(feature.route);
                }
              }}
              className="group p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.a>
          );
        })}
      </div>

      {/* Quick Wins */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          Quick Wins (Next 30 Minutes)
        </h3>
        <ul className="space-y-2">
          {config.quickWins.map((win, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-3 text-sm text-gray-300"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <span>{win}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Compact version for dashboard sidebar or landing pages
 */
interface IndustryFeatureSpotlightProps {
  industry?: string | null;
  maxFeatures?: number;
}

export function IndustryFeatureSpotlight({
  industry,
  maxFeatures = 3,
}: IndustryFeatureSpotlightProps) {
  const config =
    INDUSTRY_CONFIGS[industry || 'default'] || INDUSTRY_CONFIGS.default;
  const features = config.features.slice(0, maxFeatures);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Heart className="h-4 w-4 text-indigo-400" />
        <h4 className="text-sm font-bold text-white">Recommended for You</h4>
      </div>
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <a
            key={feature.title}
            href={feature.route}
            className="group block p-3 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-indigo-500/30 transition-all hover:scale-102"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} border border-white/10 flex items-center justify-center`}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors mb-0.5">
                  {feature.title}
                </h5>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
