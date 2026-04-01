import { Activity, Clock3, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IntegrationConfigDialog } from './integration-config-dialog';

type IntegrationCardProps = {
  id: 'slack' | 'teams' | 'jira' | 'linear' | 'google_drive' | 'webhook_relay';
  name: string;
  description: string;
  status: 'available' | 'beta';
  capabilities: string[];
  connected?: boolean;
  health?: string;
  lastSyncAt?: string | null;
  config?: Record<string, unknown> | null;
  connectedId?: string | null;
};

export function IntegrationCard(props: IntegrationCardProps) {
  const healthTone =
    props.health === 'healthy'
      ? 'default'
      : props.connected
        ? 'secondary'
        : 'outline';

  return (
    <Card className="rounded-[2rem] border border-glass-border bg-white/5">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-black tracking-tight text-foreground">
                {props.name}
              </CardTitle>
              <Badge variant={props.status === 'beta' ? 'secondary' : 'outline'}>
                {props.status}
              </Badge>
            </div>
            <CardDescription className="mt-2 max-w-md text-muted-foreground">
              {props.description}
            </CardDescription>
          </div>
          <Badge variant={healthTone}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {props.connected ? props.health ?? 'connected' : 'not connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {props.capabilities.map((capability) => (
            <span
              key={capability}
              className="rounded-full border border-glass-border bg-glass-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70"
            >
              {capability}
            </span>
          ))}
        </div>

        <div className="grid gap-3 rounded-2xl border border-glass-border bg-slate-950/50 p-4 text-sm text-muted-foreground md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-300" />
            <span>
              State:{' '}
              <span className="font-semibold text-foreground/90">
                {props.connected ? 'Active' : 'Disconnected'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-cyan-300" />
            <span>
              Last sync:{' '}
              <span className="font-semibold text-foreground/90">
                {props.lastSyncAt ? new Date(props.lastSyncAt).toLocaleString() : 'Never'}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-glass-border pt-4">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
          Provider key: {props.id}
        </span>
        <IntegrationConfigDialog
          integrationId={props.id}
          integrationName={props.name}
          connected={Boolean(props.connected)}
          connectedId={props.connectedId}
          initialConfig={props.config}
        />
      </CardFooter>
    </Card>
  );
}
