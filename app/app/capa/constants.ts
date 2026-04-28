export const CAPA_STATUSES = [
  'draft',
  'open',
  'investigating',
  'action_assigned',
  'verification',
  'closed',
  'archived',
] as const;

export type CapaStatus = (typeof CAPA_STATUSES)[number];

export const CAPA_STATUS_LABELS: Record<CapaStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  investigating: 'Investigating',
  action_assigned: 'Action assigned',
  verification: 'Verification',
  closed: 'Closed',
  archived: 'Archived',
};
