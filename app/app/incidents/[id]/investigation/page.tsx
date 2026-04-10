import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import {
  Search,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Investigation' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvestigationPage({ params }: PageProps) {
  const { id: incidentId } = await params;
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  // Fetch incident
  const { data: incident } = await db
    .from('org_incidents')
    .select('id, title, type, severity, status, created_at')
    .eq('id', incidentId)
    .eq('organization_id', state.organization.id)
    .single();

  if (!incident) redirect('/app/incidents');

  // Fetch investigation if exists
  const { data: investigation } = await db
    .from('org_investigations')
    .select('*')
    .eq('incident_id', incidentId)
    .maybeSingle();

  // Fetch org members for assignment
  const { data: _members } = await db
    .from('org_memberships')
    .select('user_id, profiles(email, display_name)')
    .eq('organization_id', state.organization.id);

  const statusIcons: Record<string, typeof CheckCircle2> = {
    assigned: Clock,
    in_progress: AlertCircle,
    findings_ready: FileText,
    review: Search,
    closed: CheckCircle2,
  };

  const StatusIcon = investigation
    ? (statusIcons[investigation.status] ?? Clock)
    : Clock;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/incidents" className="hover:underline">
          Incidents
        </Link>
        <span>/</span>
        <Link href={`/app/incidents/${incidentId}`} className="hover:underline">
          {incident.title}
        </Link>
        <span>/</span>
        <span>Investigation</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Investigation</h1>
        <p className="text-muted-foreground">
          {incident.title} — {incident.type} ({incident.severity})
        </p>
      </div>

      {investigation ? (
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted">
              <StatusIcon className="h-3.5 w-3.5" />
              {investigation.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-muted-foreground">
              Methodology:{' '}
              <span className="font-medium">
                {investigation.methodology?.replace(/_/g, ' ') ?? 'Not set'}
              </span>
            </span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="h-4 w-4 text-muted-foreground" /> Lead
                Investigator
              </div>
              <p className="text-sm">
                {investigation.lead_investigator_id ?? 'Not assigned'}
              </p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Due Date
              </div>
              <p className="text-sm">
                {investigation.due_date
                  ? new Date(investigation.due_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Findings */}
          {investigation.findings && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Findings</h3>
              <p className="text-sm whitespace-pre-wrap">
                {investigation.findings}
              </p>
            </div>
          )}

          {/* Root Cause */}
          {investigation.root_cause && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Root Cause</h3>
              <p className="text-sm whitespace-pre-wrap">
                {investigation.root_cause}
              </p>
            </div>
          )}

          {/* Interviews */}
          {investigation.interviews &&
            (investigation.interviews as unknown[]).length > 0 && (
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="text-sm font-medium mb-2">Interview Log</h3>
                <div className="space-y-2">
                  {(
                    investigation.interviews as Array<{
                      interviewee: string;
                      date: string;
                      notes: string;
                    }>
                  ).map((iv, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <p className="text-sm font-medium">{iv.interviewee}</p>
                      <p className="text-xs text-muted-foreground">{iv.date}</p>
                      <p className="text-sm mt-0.5">{iv.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Recommendations */}
          {investigation.recommendations && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-medium mb-2">Recommendations</h3>
              <p className="text-sm whitespace-pre-wrap">
                {investigation.recommendations}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg p-8 bg-card text-center">
          <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No Investigation Started</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Assign an investigation to analyze the root cause and generate
            corrective actions.
          </p>
          <p className="text-xs text-muted-foreground">
            Use the investigation form to create one — POST to the
            investigations API or use the server action.
          </p>
        </div>
      )}
    </div>
  );
}
