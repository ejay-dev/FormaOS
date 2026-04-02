'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Users,
  UserPlus,
  Trash2,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  color?: string;
  leadUserId?: string;
  parentTeamId?: string;
  memberCount: number;
  children: Team[];
}

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role?: string;
}

interface Props {
  teams: Team[];
  onSelectTeam: (teamId: string) => void;
  selectedTeamId?: string;
  members: Member[];
}

function TeamNode({
  team,
  depth,
  onSelect,
  selectedId,
}: {
  team: Team;
  depth: number;
  onSelect: (id: string) => void;
  selectedId?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = team.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 rounded ${
          selectedId === team.id
            ? 'bg-primary/10 border-l-2 border-primary'
            : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(team.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {team.color && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: team.color }}
          />
        )}
        <span className="text-sm font-medium text-foreground flex-1">
          {team.name}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" /> {team.memberCount}
        </span>
      </div>
      {expanded && hasChildren && (
        <div>
          {team.children.map((child) => (
            <TeamNode
              key={child.id}
              team={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamManagement({
  teams,
  onSelectTeam,
  selectedTeamId,
  members,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team Tree */}
      <div className="lg:col-span-1 rounded-lg border border-border bg-card">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Teams</h3>
          <button className="p-1 hover:bg-muted rounded text-muted-foreground">
            <UserPlus className="h-4 w-4" />
          </button>
        </div>
        <div className="p-2">
          {teams.map((team) => (
            <TeamNode
              key={team.id}
              team={team}
              depth={0}
              onSelect={onSelectTeam}
              selectedId={selectedTeamId}
            />
          ))}
          {teams.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No teams created yet
            </p>
          )}
        </div>
      </div>

      {/* Team Detail */}
      <div className="lg:col-span-2 rounded-lg border border-border bg-card">
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {selectedTeamId ? 'Team Members' : 'Select a team'}
          </h3>
        </div>
        <div className="p-4">
          {selectedTeamId ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role && (
                      <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                        {member.role}
                      </span>
                    )}
                    <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-muted-foreground hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No members in this team
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a team from the sidebar to manage members
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
