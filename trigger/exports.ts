import { task } from '@trigger.dev/sdk';
import {
  runComplianceExportJob,
  runEnterpriseExportJob,
  runQueueProcessBatch,
  runReportExportJob,
} from './http';
export { webhookDeliveryTask } from './webhook-delivery';
export { notificationDigestTask } from './notification-digest';
export {
  executeWorkflowTask,
  resumeWorkflowAfterApproval,
  resumeWorkflowAfterDelay,
  workflowTimeoutCheck,
} from './workflow-execution';

export const reportExportJobTask = task({
  id: 'report-export-job',
  run: async (payload: { jobId: string }) => {
    const result = await runReportExportJob(payload.jobId);

    if (!result.ok) {
      throw new Error(result.error ?? 'Report export failed');
    }

    return result;
  },
});

export const complianceExportJobTask = task({
  id: 'compliance-export-job',
  run: async (payload: { jobId: string }) => {
    const result = await runComplianceExportJob(payload.jobId);

    if (!result.ok) {
      throw new Error(result.error ?? 'Compliance export failed');
    }

    return result;
  },
});

export const enterpriseExportJobTask = task({
  id: 'enterprise-export-job',
  run: async (payload: { jobId: string }) => {
    const result = await runEnterpriseExportJob(payload.jobId);

    if (!result.ok) {
      throw new Error(result.error ?? 'Enterprise export failed');
    }

    return result;
  },
});

export const queueProcessBatchTask = task({
  id: 'queue-process-batch',
  run: async (payload?: { batchSize?: number }) => {
    const result = await runQueueProcessBatch(payload?.batchSize);

    if (result.success === false) {
      throw new Error(result.error ?? 'Queue processing failed');
    }

    return result;
  },
});
