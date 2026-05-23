import { redirect } from 'next/navigation';

// v4-029: /app/audit consolidated into /app/audit-trail (canonical).
// /app/audit/export/[userId] subroute is preserved for direct
// links from audit emails — it lives under app/app/audit/export/.
export default function LegacyAuditRedirect() {
  redirect('/app/audit-trail');
}
