"use client";

import { useCallback } from "react";
import { useComplianceToast } from "./compliance-toast";

/**
 * =========================================================
 * COMPLIANCE ACTION HOOKS
 * =========================================================
 * Hooks for triggering compliance system feedback.
 * Use these to report node/wire changes from any component.
 */

type NodeType = "policy" | "control" | "evidence" | "audit" | "risk" | "task" | "entity";
type NodeAction = "created" | "updated" | "deleted" | "linked" | "verified";

interface ActionFeedback {
  title: string;
  message?: string;
  nodeType?: NodeType;
  nodeAction?: NodeAction;
  wireFrom?: string;
  wireTo?: string;
  impactArea?: string;
  impactDelta?: number;
}

/**
 * Hook to report compliance actions with visual feedback
 */
export function useComplianceAction() {
  const { showToast } = useComplianceToast();

  const reportSuccess = useCallback((feedback: ActionFeedback) => {
    showToast({
      type: "success",
      title: feedback.title,
      message: feedback.message,
      nodeType: feedback.nodeType,
      nodeAction: feedback.nodeAction,
      wireFrom: feedback.wireFrom,
      wireTo: feedback.wireTo,
      impactArea: feedback.impactArea,
      impactDelta: feedback.impactDelta,
    });
  }, [showToast]);

  const reportError = useCallback((feedback: ActionFeedback) => {
    showToast({
      type: "error",
      title: feedback.title,
      message: feedback.message,
      nodeType: feedback.nodeType,
      nodeAction: feedback.nodeAction,
    });
  }, [showToast]);

  const reportInfo = useCallback((feedback: ActionFeedback) => {
    showToast({
      type: "info",
      title: feedback.title,
      message: feedback.message,
      nodeType: feedback.nodeType,
    });
  }, [showToast]);

  const reportWarning = useCallback((feedback: ActionFeedback) => {
    showToast({
      type: "warning",
      title: feedback.title,
      message: feedback.message,
      nodeType: feedback.nodeType,
    });
  }, [showToast]);

  // Convenience methods for common operations
  const nodeCreated = useCallback((nodeType: NodeType, nodeName: string, impactArea?: string) => {
    reportSuccess({
      title: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} created`,
      message: nodeName,
      nodeType,
      nodeAction: "created",
      impactArea,
      impactDelta: impactArea ? 5 : undefined,
    });
  }, [reportSuccess]);

  const nodeUpdated = useCallback((nodeType: NodeType, nodeName: string) => {
    reportSuccess({
      title: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} updated`,
      message: nodeName,
      nodeType,
      nodeAction: "updated",
    });
  }, [reportSuccess]);

  const nodeDeleted = useCallback((nodeType: NodeType, nodeName: string) => {
    reportInfo({
      title: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} deleted`,
      message: nodeName,
      nodeType,
      nodeAction: "deleted",
    });
  }, [reportInfo]);

  const nodesLinked = useCallback((
    fromType: NodeType, 
    fromName: string, 
    toType: NodeType, 
    toName: string,
    impactArea?: string
  ) => {
    reportSuccess({
      title: "Connection established",
      message: `${fromName} linked to ${toName}`,
      nodeType: fromType,
      nodeAction: "linked",
      wireFrom: fromName,
      wireTo: toName,
      impactArea: impactArea || "Compliance posture",
      impactDelta: 3,
    });
  }, [reportSuccess]);

  const evidenceAdded = useCallback((evidenceName: string, controlName?: string) => {
    reportSuccess({
      title: "Evidence added",
      message: controlName ? `${evidenceName} linked to ${controlName}` : evidenceName,
      nodeType: "evidence",
      nodeAction: controlName ? "linked" : "created",
      wireFrom: evidenceName,
      wireTo: controlName,
      impactArea: "Audit readiness",
      impactDelta: 5,
    });
  }, [reportSuccess]);

  const taskCompleted = useCallback((taskName: string, controlName?: string) => {
    reportSuccess({
      title: "Task completed",
      message: taskName,
      nodeType: "task",
      nodeAction: "verified",
      wireFrom: taskName,
      wireTo: controlName,
      impactArea: "Control compliance",
      impactDelta: 8,
    });
  }, [reportSuccess]);

  const riskIdentified = useCallback((riskName: string, severity: "low" | "medium" | "high") => {
    const fn = severity === "high" ? reportWarning : reportInfo;
    fn({
      title: `${severity.charAt(0).toUpperCase() + severity.slice(1)} risk identified`,
      message: riskName,
      nodeType: "risk",
      nodeAction: "created",
    });
  }, [reportWarning, reportInfo]);

  return {
    reportSuccess,
    reportError,
    reportInfo,
    reportWarning,
    // Convenience methods
    nodeCreated,
    nodeUpdated,
    nodeDeleted,
    nodesLinked,
    evidenceAdded,
    taskCompleted,
    riskIdentified,
  };
}

export default useComplianceAction;
