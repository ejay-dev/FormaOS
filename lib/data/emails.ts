import { getOrganizationEmailLogsCompat } from "@/lib/email/email-log-compat";

export async function getOrganizationEmailLogs(orgId: string, limit = 50) {
  return getOrganizationEmailLogsCompat(orgId, limit);
}
