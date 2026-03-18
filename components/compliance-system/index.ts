/**
 * =========================================================
 * FORMAOS COMPLIANCE OPERATING SYSTEM
 * Graph-Based Visual Language Components
 * =========================================================
 * 
 * This module exports the core node/wire visual system that
 * represents the compliance graph architecture:
 * 
 * Nodes:
 *  - Policy (cyan pill/hex)
 *  - Control (teal square)
 *  - Evidence (purple circle)
 *  - Audit (amber diamond)
 *  - Risk (red triangle)
 *  - Task (green rounded rect)
 *  - Entity (neutral container)
 * 
 * Wires:
 *  - Policy → Control (solid cyan)
 *  - Control → Evidence (dotted teal)
 *  - Evidence → Audit (dashed purple)
 *  - Audit → Risk (alert amber/red)
 *  - Risk → Task (zigzag red)
 *  - Task → Control (green loop)
 * 
 * =========================================================
 */

// Core Node Components
export { ComplianceNode, type NodeType, type NodeState } from './compliance-node';
export { ComplianceWire, ComplianceWireVertical, WireLabel, type WireType } from './compliance-wire';

// Feedback & Progress
export { SystemFeedback, type FeedbackType, type SystemFeedbackData } from './system-feedback';
export { ProgressIndicator, InlineProgress, LoadingOverlay, ComplianceSkeleton } from './progress-indicator';

// Graph Visualization
export { ComplianceGraph, LifecycleMini } from './compliance-graph';
export { ComplianceLifecycleHeader } from './compliance-lifecycle-header';

// Interactive Elements
export { ActionButton, IconActionButton, type ActionResult } from './action-button';
export { NodeBadge, StatusBadge } from './node-badge';

// Toast System
export { ComplianceToast, ComplianceToastProvider, useComplianceToast } from './compliance-toast';
export { useComplianceAction } from './use-compliance-action';

// System State Components
export { SystemNode, SystemNodeGrid } from './system-node';
export { SystemWire, WireCanvas } from './system-wire';

// Flow Components
export { PlanActivationFlow } from './plan-activation-flow';
export { FeatureEnableFlow } from './feature-enable-flow';
export { AdminPermissionFlow } from './admin-permission-flow';

// Provider
export { ComplianceSystemProvider } from './provider';
