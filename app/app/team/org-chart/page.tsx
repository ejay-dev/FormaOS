import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OrgChart } from '@/components/team/org-chart';
import { Network, Users, UserCheck } from 'lucide-react';

export const metadata = { title: 'Org Chart | FormaOS' };

interface TeamRow {
  id: string;
  name: string;
  color: string | null;
  parent_team_id: string | null;
  lead_user_id: string | null;
}

interface OrgTeam {
  id: string;
  name: string;
  color?: string;
  leadName?: string;
  memberCount: number;
  children: OrgTeam[];
}

function buildTree(
  teams: TeamRow[],
  memberCounts: Record<string, number>,
  leadNames: Record<string, string>,
): OrgTeam[] {
  const map = new Map<string, OrgTeam>();
  for (const t of teams) {
    map.set(t.id, {
      id: t.id,
      name: t.name,
      color: t.color || undefined,
      leadName: t.lead_user_id ? leadNames[t.lead_user_id] : undefined,
      memberCount: memberCounts[t.id] || 0,
      children: [],
    });
  }
  const roots: OrgTeam[] = [];
  for (const t of teams) {
    const node = map.get(t.id)!;
    if (t.parent_team_id && map.has(t.parent_team_id)) {
      map.get(t.parent_team_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export default async function OrgChartPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  const [{ data: teams }, { data: members }, { data: profiles }] =
    await Promise.all([
      db
        .from('team_groups')
        .select('*')
        .eq('org_id', state.organization.id)
        .order('name'),
      db
        .from('team_members')
        .select('team_id, user_id')
        .eq('org_id', state.organization.id),
      db
        .from('org_members')
        .select('user_id, display_name')
        .eq('org_id', state.organization.id),
    ]);

  const memberCounts: Record<string, number> = {};
  for (const m of members || []) {
    memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
  }

  const leadNames: Record<string, string> = {};
  for (const p of profiles || []) {
    leadNames[p.user_id] = p.display_name || 'Unknown';
  }

  const tree = buildTree((teams || []) as TeamRow[], memberCounts, leadNames);

  const totalMembers = new Set((members || []).map((m) => m.user_id)).size;
  const totalTeams = (teams || []).length;
  const teamsWithLeads = (teams || []).filter(
    (t: TeamRow) => t.lead_user_id,
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Organization Chart
        </h1>
        <p className="text-sm text-muted-foreground">
          Visual team structure and reporting hierarchy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Network className="h-4 w-4" />{' '}
            <span className="text-xs">Teams</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalTeams}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />{' '}
            <span className="text-xs">Members</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <UserCheck className="h-4 w-4" />{' '}
            <span className="text-xs">Teams with Leads</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{teamsWithLeads}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card min-h-[400px]">
        <OrgChart teams={tree} />
      </div>
    </div>
  );
}
