'use client';

interface OrgTeam {
  id: string;
  name: string;
  color?: string;
  leadName?: string;
  memberCount: number;
  children: OrgTeam[];
}

function OrgNode({ team, isRoot }: { team: OrgTeam; isRoot?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-lg border-2 px-4 py-3 min-w-[140px] text-center ${
          isRoot ? 'border-primary bg-primary/10' : 'border-border bg-card'
        }`}
        style={team.color ? { borderColor: team.color } : undefined}
      >
        <p className="text-sm font-semibold text-foreground">{team.name}</p>
        {team.leadName && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {team.leadName}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
        </p>
      </div>

      {team.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="relative flex gap-8">
            {team.children.length > 1 && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                style={{
                  width: `calc(100% - 140px)`,
                }}
              />
            )}
            {team.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <OrgNode team={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrgChart({ teams }: { teams: OrgTeam[] }) {
  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No teams to display. Create teams in Settings → Roles & Teams.
      </div>
    );
  }

  return (
    <div className="overflow-auto p-8">
      <div className="flex justify-center gap-12">
        {teams.map((team) => (
          <OrgNode key={team.id} team={team} isRoot />
        ))}
      </div>
    </div>
  );
}
