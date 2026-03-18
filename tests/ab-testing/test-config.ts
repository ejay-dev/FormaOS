/**
 * A/B Testing Configuration and Test Definitions
 * Central configuration for all A/B tests in FormaOS
 */

export interface ABTestDefinition {
  testId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  trafficAllocation: number;
  targetAudience?: string[];
  variants: ABTestVariantDefinition[];
  successMetrics: ABTestMetric[];
  hypothesis: string;
  minSampleSize: number;
  maxDuration: number; // days
}

export interface ABTestVariantDefinition {
  id: string;
  name: string;
  description: string;
  weight: number;
  config: Record<string, any>;
  expectedImpact?: string;
}

export interface ABTestMetric {
  name: string;
  type: 'primary' | 'secondary';
  description: string;
  successCriteria: {
    direction: 'increase' | 'decrease';
    threshold: number; // minimum improvement percentage
    confidenceLevel: number; // e.g., 0.95 for 95% confidence
  };
}

/**
 * Predefined A/B Tests for FormaOS
 */
export const AB_TEST_DEFINITIONS: ABTestDefinition[] = [
  {
    testId: 'homepage_hero_2026_q1',
    name: 'Homepage Hero Optimization Q1 2026',
    description:
      'Test different hero section designs to improve signup conversion',
    status: 'active',
    startDate: '2026-01-15T00:00:00Z',
    endDate: '2026-03-15T23:59:59Z',
    trafficAllocation: 50,
    targetAudience: ['new_visitors', 'organic_traffic'],
    hypothesis:
      'A cleaner hero design with stronger value proposition will increase signup rate by 15%',
    minSampleSize: 1000,
    maxDuration: 60,
    variants: [
      {
        id: 'control',
        name: 'Original Hero Design',
        description: 'Current hero section with gradient background',
        weight: 50,
        config: {
          design: 'gradient_hero',
          headline: 'Transform Your Business Operations',
          subheading:
            'Streamline workflows, automate processes, and scale efficiently with FormaOS',
          ctaText: 'Start Free Trial',
          ctaStyle: 'primary',
          showTrustBadges: true,
          showTestimonials: false,
          heroImage: '/images/hero-dashboard.png',
        },
        expectedImpact: 'Baseline performance',
      },
      {
        id: 'minimal_value_prop',
        name: 'Minimal Value Proposition',
        description: 'Clean design focusing on core value proposition',
        weight: 50,
        config: {
          design: 'minimal_hero',
          headline: 'Operations Made Simple',
          subheading: 'One platform. Zero complexity. Infinite possibilities.',
          ctaText: 'Get Started Free',
          ctaStyle: 'gradient',
          showTrustBadges: false,
          showTestimonials: true,
          heroImage: '/images/hero-simple.png',
        },
        expectedImpact: '+15% signup conversion',
      },
    ],
    successMetrics: [
      {
        name: 'signup_conversion',
        type: 'primary',
        description: 'Percentage of visitors who complete signup',
        successCriteria: {
          direction: 'increase',
          threshold: 15,
          confidenceLevel: 0.95,
        },
      },
      {
        name: 'time_to_signup',
        type: 'secondary',
        description: 'Average time from landing to signup completion',
        successCriteria: {
          direction: 'decrease',
          threshold: 10,
          confidenceLevel: 0.9,
        },
      },
      {
        name: 'bounce_rate',
        type: 'secondary',
        description: 'Percentage of single-page sessions',
        successCriteria: {
          direction: 'decrease',
          threshold: 5,
          confidenceLevel: 0.9,
        },
      },
    ],
  },

  {
    testId: 'pricing_display_2026_q1',
    name: 'Pricing Page Display Test',
    description: 'Test different pricing layouts to improve plan selection',
    status: 'active',
    startDate: '2026-01-20T00:00:00Z',
    endDate: '2026-04-20T23:59:59Z',
    trafficAllocation: 30,
    targetAudience: ['pricing_page_visitors'],
    hypothesis:
      'Simplified pricing with clear value tiers will increase plan selection by 20%',
    minSampleSize: 500,
    maxDuration: 90,
    variants: [
      {
        id: 'control',
        name: 'Three-Tier Layout',
        description: 'Current three-tier pricing layout',
        weight: 50,
        config: {
          layout: 'three_tier',
          tiers: ['starter', 'professional', 'enterprise'],
          highlightTier: 'professional',
          showAnnualDiscount: true,
          showFeatureComparison: true,
          ctaText: 'Choose Plan',
        },
        expectedImpact: 'Baseline performance',
      },
      {
        id: 'simplified_two_tier',
        name: 'Simplified Two-Tier',
        description: 'Two main tiers with enterprise contact option',
        weight: 50,
        config: {
          layout: 'two_tier_plus',
          tiers: ['business', 'enterprise'],
          highlightTier: 'business',
          showAnnualDiscount: false,
          showFeatureComparison: false,
          ctaText: 'Start Now',
          enterpriseCtaText: 'Contact Sales',
        },
        expectedImpact: '+20% plan selection',
      },
    ],
    successMetrics: [
      {
        name: 'plan_selection_rate',
        type: 'primary',
        description: 'Percentage of pricing page visitors who select a plan',
        successCriteria: {
          direction: 'increase',
          threshold: 20,
          confidenceLevel: 0.95,
        },
      },
      {
        name: 'trial_to_paid_conversion',
        type: 'primary',
        description: 'Percentage of trials that convert to paid',
        successCriteria: {
          direction: 'increase',
          threshold: 10,
          confidenceLevel: 0.9,
        },
      },
      {
        name: 'average_plan_value',
        type: 'secondary',
        description: 'Average MRR of selected plans',
        successCriteria: {
          direction: 'increase',
          threshold: 15,
          confidenceLevel: 0.85,
        },
      },
    ],
  },

  {
    testId: 'onboarding_flow_2026_q1',
    name: 'User Onboarding Flow Optimization',
    description: 'Streamline onboarding to improve completion rates',
    status: 'active',
    startDate: '2026-01-25T00:00:00Z',
    trafficAllocation: 75,
    targetAudience: ['new_signups'],
    hypothesis:
      'Reducing onboarding steps from 7 to 3 will increase completion rate by 25%',
    minSampleSize: 800,
    maxDuration: 45,
    variants: [
      {
        id: 'control',
        name: 'Comprehensive 7-Step Flow',
        description: 'Current detailed onboarding process',
        weight: 50,
        config: {
          steps: [
            'welcome',
            'company_profile',
            'team_size',
            'use_cases',
            'integrations',
            'sample_data',
            'tutorial',
          ],
          progressIndicator: true,
          skipOption: false,
          dataCollection: 'comprehensive',
        },
        expectedImpact: 'Baseline performance',
      },
      {
        id: 'streamlined_quick_start',
        name: '3-Step Quick Start',
        description: 'Minimal onboarding with progressive disclosure',
        weight: 50,
        config: {
          steps: ['welcome_and_basics', 'quick_setup', 'first_success'],
          progressIndicator: false,
          skipOption: true,
          dataCollection: 'minimal',
        },
        expectedImpact: '+25% completion rate',
      },
    ],
    successMetrics: [
      {
        name: 'onboarding_completion_rate',
        type: 'primary',
        description: 'Percentage of users who complete full onboarding',
        successCriteria: {
          direction: 'increase',
          threshold: 25,
          confidenceLevel: 0.95,
        },
      },
      {
        name: 'time_to_first_value',
        type: 'primary',
        description: 'Time from signup to first meaningful action',
        successCriteria: {
          direction: 'decrease',
          threshold: 30,
          confidenceLevel: 0.9,
        },
      },
      {
        name: 'day_7_retention',
        type: 'secondary',
        description: '7-day user retention rate',
        successCriteria: {
          direction: 'increase',
          threshold: 15,
          confidenceLevel: 0.9,
        },
      },
    ],
  },

  {
    testId: 'dashboard_layout_2026_q1',
    name: 'Dashboard Layout Usability Test',
    description: 'Test different dashboard layouts for user engagement',
    status: 'draft',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-05-01T23:59:59Z',
    trafficAllocation: 40,
    targetAudience: ['active_users', 'power_users'],
    hypothesis:
      'Widget-based customizable dashboard will increase daily engagement by 18%',
    minSampleSize: 1200,
    maxDuration: 90,
    variants: [
      {
        id: 'control',
        name: 'Fixed Layout Dashboard',
        description: 'Current structured dashboard layout',
        weight: 50,
        config: {
          layout: 'fixed',
          sections: [
            'overview',
            'recent_activity',
            'quick_actions',
            'analytics',
          ],
          customizable: false,
          widgets: [],
        },
        expectedImpact: 'Baseline performance',
      },
      {
        id: 'customizable_widgets',
        name: 'Customizable Widget Dashboard',
        description: 'Drag-and-drop widget-based dashboard',
        weight: 50,
        config: {
          layout: 'flexible',
          defaultWidgets: ['kpi_summary', 'activity_feed', 'quick_actions'],
          customizable: true,
          availableWidgets: [
            'analytics_chart',
            'task_list',
            'team_activity',
            'notifications',
            'calendar',
            'documents',
          ],
        },
        expectedImpact: '+18% daily engagement',
      },
    ],
    successMetrics: [
      {
        name: 'daily_active_engagement',
        type: 'primary',
        description: 'Time spent actively using dashboard features',
        successCriteria: {
          direction: 'increase',
          threshold: 18,
          confidenceLevel: 0.95,
        },
      },
      {
        name: 'feature_adoption_rate',
        type: 'secondary',
        description: 'Percentage of users trying new features',
        successCriteria: {
          direction: 'increase',
          threshold: 12,
          confidenceLevel: 0.9,
        },
      },
    ],
  },

  {
    testId: 'mobile_app_cta_2026_q1',
    name: 'Mobile App Download CTA Test',
    description: 'Optimize mobile app promotion for downloads',
    status: 'draft',
    startDate: '2026-02-15T00:00:00Z',
    trafficAllocation: 100,
    targetAudience: ['mobile_visitors'],
    hypothesis:
      'Contextual mobile app promotion will increase downloads by 40%',
    minSampleSize: 600,
    maxDuration: 30,
    variants: [
      {
        id: 'control',
        name: 'Banner Promotion',
        description: 'Standard app banner at top of mobile pages',
        weight: 33,
        config: {
          promotionType: 'top_banner',
          message: 'Get the FormaOS mobile app',
          timing: 'immediate',
          dismissible: true,
        },
        expectedImpact: 'Baseline performance',
      },
      {
        id: 'contextual_promotion',
        name: 'Contextual In-Content',
        description: 'App promotion within relevant content sections',
        weight: 33,
        config: {
          promotionType: 'contextual',
          message: 'Access this on the go with our mobile app',
          timing: 'after_engagement',
          dismissible: false,
        },
        expectedImpact: '+40% downloads',
      },
      {
        id: 'exit_intent_popup',
        name: 'Exit Intent Popup',
        description: 'App promotion when user shows exit intent',
        weight: 34,
        config: {
          promotionType: 'exit_intent',
          message: 'Take FormaOS with you - Download our app',
          timing: 'exit_intent',
          dismissible: true,
          incentive: 'exclusive_mobile_features',
        },
        expectedImpact: '+25% downloads',
      },
    ],
    successMetrics: [
      {
        name: 'app_download_rate',
        type: 'primary',
        description: 'Percentage of mobile visitors who download app',
        successCriteria: {
          direction: 'increase',
          threshold: 40,
          confidenceLevel: 0.95,
        },
      },
      {
        name: 'app_install_to_signup',
        type: 'secondary',
        description: 'Conversion from app install to account creation',
        successCriteria: {
          direction: 'increase',
          threshold: 20,
          confidenceLevel: 0.85,
        },
      },
    ],
  },
];

/**
 * A/B Test Utilities
 */
export class ABTestConfig {
  /**
   * Get test definition by ID
   */
  static getTest(testId: string): ABTestDefinition | undefined {
    return AB_TEST_DEFINITIONS.find((test) => test.testId === testId);
  }

  /**
   * Get active tests
   */
  static getActiveTests(): ABTestDefinition[] {
    const now = new Date();
    return AB_TEST_DEFINITIONS.filter((test) => {
      if (test.status !== 'active') return false;

      const startDate = new Date(test.startDate);
      if (now < startDate) return false;

      if (test.endDate) {
        const endDate = new Date(test.endDate);
        if (now > endDate) return false;
      }

      return true;
    });
  }

  /**
   * Get tests by audience
   */
  static getTestsByAudience(audience: string): ABTestDefinition[] {
    return this.getActiveTests().filter((test) =>
      test.targetAudience?.includes(audience),
    );
  }

  /**
   * Validate test configuration
   */
  static validateTest(test: ABTestDefinition): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check variant weights
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    // Check dates
    const startDate = new Date(test.startDate);
    const endDate = test.endDate ? new Date(test.endDate) : null;

    if (endDate && endDate <= startDate) {
      errors.push('End date must be after start date');
    }

    // Check traffic allocation
    if (test.trafficAllocation < 1 || test.trafficAllocation > 100) {
      errors.push('Traffic allocation must be between 1 and 100');
    }

    // Check sample size
    if (test.minSampleSize < 100) {
      errors.push('Minimum sample size should be at least 100');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Export test definitions for use in A/B testing framework
 */
export default AB_TEST_DEFINITIONS;
