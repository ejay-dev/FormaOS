'use client';

// Audit Sprint 7c (2026-05-24): migrated from ad-hoc `fixed inset-0`
// modal wrapper to the shared Dialog primitive (Sprint 4c). Gains focus
// trap, ESC, aria-modal, scroll lock. Cyan "Integration Config" eyebrow
// removed per the stored enterprise-aesthetic preference.

import { useState, useTransition } from 'react';
import { FlaskConical, Link2, PlugZap, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type IntegrationId =
  | 'slack'
  | 'teams'
  | 'jira'
  | 'linear'
  | 'google_drive'
  | 'webhook_relay';

type IntegrationDialogProps = {
  integrationId: IntegrationId;
  integrationName: string;
  connected: boolean;
  connectedId?: string | null;
  initialConfig?: Record<string, unknown> | null;
};

const FIELD_MAP: Record<
  IntegrationId,
  Array<{ key: string; label: string; placeholder: string }>
> = {
  slack: [
    { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
    { key: 'channel', label: 'Channel', placeholder: '#compliance-alerts' },
  ],
  teams: [
    { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://outlook.office.com/webhook/...' },
    { key: 'channel_name', label: 'Channel Name', placeholder: 'Governance' },
  ],
  jira: [
    { key: 'cloud_id', label: 'Cloud ID', placeholder: 'Atlassian cloud id' },
    { key: 'access_token', label: 'Access Token', placeholder: 'OAuth access token' },
    { key: 'project_key', label: 'Project Key', placeholder: 'COMP' },
    { key: 'issue_type_id', label: 'Issue Type ID', placeholder: '10001' },
  ],
  linear: [
    { key: 'api_key', label: 'API Key', placeholder: 'lin_api_...' },
    { key: 'team_id', label: 'Team ID', placeholder: 'Linear team id' },
  ],
  google_drive: [
    { key: 'access_token', label: 'Access Token', placeholder: 'OAuth access token' },
    { key: 'refresh_token', label: 'Refresh Token', placeholder: 'OAuth refresh token' },
    { key: 'folder_id', label: 'Folder ID', placeholder: 'Optional shared folder id' },
  ],
  webhook_relay: [
    { key: 'relay_enabled', label: 'Relay Enabled', placeholder: 'true' },
  ],
};

export function IntegrationConfigDialog({
  integrationId,
  integrationName,
  connected,
  connectedId,
  initialConfig,
}: IntegrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<Record<string, string>>(() => {
    const entries = FIELD_MAP[integrationId].map((field) => [
      field.key,
      String(initialConfig?.[field.key] ?? ''),
    ]);
    return Object.fromEntries(entries);
  });

  const fields = FIELD_MAP[integrationId];

  async function runRequest(method: 'POST' | 'DELETE', body?: Record<string, unknown>) {
    const response = await fetch(`/api/v1/integrations/${integrationId}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      data?: { message?: string; ok?: boolean };
    };

    if (!response.ok) {
      throw new Error(payload.error ?? 'Request failed');
    }

    return payload;
  }

  function onConnect() {
    startTransition(async () => {
      try {
        setMessage(null);
        await runRequest('POST', {
          action: 'connect',
          config: formState,
        });
        setMessage('Integration saved. Refreshing state…');
        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to save integration');
      }
    });
  }

  function onTest() {
    startTransition(async () => {
      try {
        setMessage(null);
        const payload = await runRequest('POST', { action: 'test' });
        setMessage(payload.data?.message ?? 'Connection test completed');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to test integration');
      }
    });
  }

  function onDisconnect() {
    startTransition(async () => {
      try {
        setMessage(null);
        await runRequest('DELETE');
        setMessage('Integration disconnected. Refreshing state…');
        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to disconnect integration');
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant={connected ? 'outline' : 'gradient'} onClick={() => setOpen(true)}>
          <PlugZap className="h-4 w-4" />
          {connected ? 'Manage' : 'Connect'}
        </Button>
        {connected ? (
          <Button variant="secondary" onClick={onTest} loading={isPending}>
            <FlaskConical className="h-4 w-4" />
            Test
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{integrationName}</DialogTitle>
            <DialogDescription>
              Configure credentials, test health, and manage the current connection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {field.label}
                  </span>
                  <Input
                    value={formState[field.key] ?? ''}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-surface-1 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground/90">
                <Link2 className="h-4 w-4" />
                Connection metadata
              </div>
              <p className="mt-2">
                Provider key: <span className="font-mono text-foreground/90">{integrationId}</span>
              </p>
              {connectedId ? (
                <p className="mt-1">
                  Connected row id:{' '}
                  <span className="font-mono text-foreground/90">{connectedId}</span>
                </p>
              ) : null}
            </div>

            {message ? (
              <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-foreground">
                {message}
              </div>
            ) : null}
          </div>

          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              {connected ? (
                <Button variant="destructive" onClick={onDisconnect} loading={isPending}>
                  <Unplug className="h-4 w-4" />
                  Disconnect
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              {connected ? (
                <Button variant="secondary" onClick={onTest} loading={isPending}>
                  Test Connection
                </Button>
              ) : null}
              <Button variant="gradient" onClick={onConnect} loading={isPending}>
                Save Configuration
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
