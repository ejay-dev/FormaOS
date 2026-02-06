/**
 * FormaOS Automation Engine
 * Centralized exports for automation functionality
 */

// Compliance Score Engine
export {
  calculateComplianceScore,
  saveComplianceScore,
  updateComplianceScore,
  type ComplianceScoreResult,
} from './compliance-score-engine';

// Trigger Engine
export {
  processTrigger,
  type TriggerType,
  type TriggerEvent,
  type AutomationResult,
} from './trigger-engine';

// Event Processor
export {
  processEvent,
  monitorComplianceScoreChanges,
  type EventType,
  type DatabaseEvent,
} from './event-processor';

// Scheduled Processor
export {
  runScheduledAutomation,
  runScheduledCheck,
} from './scheduled-processor';

// Integration Helpers
export {
  onEvidenceUploaded,
  onEvidenceVerified,
  onControlStatusUpdated,
  onTaskCompleted,
  onTaskCreated,
  onSubscriptionActivated,
  onOnboardingCompleted,
  updateComplianceScoreAndCheckRisk,
  batchUpdateComplianceScores,
} from './integration';
