import { redirect } from 'next/navigation';

// v4-029: /app/history consolidated into /app/audit-trail (canonical).
export default function LegacyHistoryRedirect() {
  redirect('/app/audit-trail');
}
