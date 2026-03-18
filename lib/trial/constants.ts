/**
 * =========================================================
 * TRIAL SYSTEM CONSTANTS
 * =========================================================
 * Single source of truth for all trial-related configuration.
 */

/** Default trial duration in days */
export const TRIAL_DURATION_DAYS = 14;

/** Days remaining threshold for "expiring soon" warning */
export const TRIAL_EXPIRING_SOON_DAYS = 5;

/** Days remaining threshold for "urgent" warning */
export const TRIAL_URGENT_DAYS = 3;

/** Days remaining threshold for "last day" critical warning */
export const TRIAL_LAST_DAY_THRESHOLD = 1;

/** Maximum admin trial extension in days */
export const MAX_TRIAL_EXTENSION_DAYS = 30;

/** Feature usage thresholds (% of limit) for upgrade nudges */
export const USAGE_THRESHOLD_NUDGE = 70;
export const USAGE_THRESHOLD_WARNING = 90;
export const USAGE_THRESHOLD_HARD_LIMIT = 100;

/** Minimum feature actions before showing upgrade suggestion */
export const MIN_ACTIONS_FOR_UPGRADE_SUGGESTION = 15;

/** Interval (ms) between upgrade suggestion popups — prevent fatigue */
export const UPGRADE_SUGGESTION_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

/** Local storage keys */
export const LS_UPGRADE_DISMISSED_AT = 'formaos_upgrade_dismissed_at';
export const LS_UPGRADE_MODAL_SHOWN_COUNT = 'formaos_upgrade_modal_shown';
export const LS_FEATURE_ACTION_COUNT = 'formaos_feature_actions';

/** Trial status enum */
export type TrialStatus =
  | 'active' // Trial running with plenty of time
  | 'expiring_soon' // Within TRIAL_EXPIRING_SOON_DAYS
  | 'urgent' // Within TRIAL_URGENT_DAYS
  | 'last_day' // Last day of trial
  | 'expired' // Trial has ended
  | 'converted' // User has upgraded to a paid plan
  | 'not_applicable'; // Not a trial user

/** Features that are soft-locked after trial expiry */
export const SOFT_LOCKED_FEATURES_AFTER_TRIAL = [
  'reports',
  'audits',
  'vault',
  'registers',
  'team',
  'automation',
] as const;

/** Features always accessible (even after trial expiry) */
export const ALWAYS_ACCESSIBLE_FEATURES = [
  'controls',
  'evidence',
  'policies',
  'tasks',
  'settings',
  'billing',
] as const;
