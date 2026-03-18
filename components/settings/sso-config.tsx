'use client';

import { useState, useTransition } from 'react';

type Props = {
  orgId: string;
  initial: {
    enabled: boolean;
    enforceSso: boolean;
    allowedDomains: string[];
    idpMetadataXml: string | null;
    jitProvisioningEnabled: boolean;
    jitDefaultRole: 'owner' | 'admin' | 'member' | 'viewer' | 'auditor';
  };
  sp: {
    metadataUrl: string;
    acsUrl: string;
    entityId: string;
  };
};

function parseDomains(value: string) {
  return value
    .split(/[\n, ]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function SsoConfigPanel({ orgId, initial, sp }: Props) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [enforceSso, setEnforceSso] = useState(initial.enforceSso);
  const [metadataXml, setMetadataXml] = useState(initial.idpMetadataXml ?? '');
  const [domains, setDomains] = useState((initial.allowedDomains ?? []).join('\n'));
  const [jitEnabled, setJitEnabled] = useState(initial.jitProvisioningEnabled);
  const [jitDefaultRole, setJitDefaultRole] = useState(initial.jitDefaultRole);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/sso/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          enabled,
          enforceSso,
          allowedDomains: parseDomains(domains),
          idpMetadataXml: metadataXml.trim() || null,
          jitProvisioningEnabled: jitEnabled,
          jitDefaultRole,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Failed to save SSO configuration');
        return;
      }
      setMessage('SSO configuration saved.');
    });
  };

  const testConnection = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/sso/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.redirectUrl) {
        setError(payload.error ?? 'Failed to create test SSO redirect');
        return;
      }
      window.open(payload.redirectUrl, '_blank', 'noopener,noreferrer');
      setMessage('Opened a test SSO redirect in a new tab.');
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-100">SSO Configuration</h2>
          <p className="text-sm text-slate-400">
            Upload IdP metadata, enforce SSO by domain, and enable JIT provisioning.
          </p>
        </div>
        <button
          type="button"
          onClick={testConnection}
          disabled={isPending || !enabled}
          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
        >
          Test Connection
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 space-y-4">
          <label className="flex items-center justify-between text-sm text-slate-200">
            Enable SAML SSO
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          </label>
          <label className="flex items-center justify-between text-sm text-slate-200">
            Enforce SSO for allowed domains
            <input
              type="checkbox"
              checked={enforceSso}
              onChange={(event) => setEnforceSso(event.target.checked)}
              disabled={!enabled}
            />
          </label>
          <label className="flex items-center justify-between text-sm text-slate-200">
            Enable JIT provisioning
            <input
              type="checkbox"
              checked={jitEnabled}
              onChange={(event) => setJitEnabled(event.target.checked)}
              disabled={!enabled}
            />
          </label>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Default JIT Role
            </div>
            <select
              value={jitDefaultRole}
              onChange={(event) => setJitDefaultRole(event.target.value as Props['initial']['jitDefaultRole'])}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {['member', 'viewer', 'auditor', 'admin', 'owner'].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Allowed Domains
            </div>
            <textarea
              value={domains}
              onChange={(event) => setDomains(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder={'example.com\nsubsidiary.example.com'}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 space-y-4">
          <div className="grid gap-3 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Metadata URL
              </div>
              <code className="block break-all text-slate-200">{sp.metadataUrl}</code>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                ACS URL
              </div>
              <code className="block break-all text-slate-200">{sp.acsUrl}</code>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Entity ID
              </div>
              <code className="block break-all text-slate-200">{sp.entityId}</code>
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              IdP Metadata XML
            </div>
            <textarea
              value={metadataXml}
              onChange={(event) => setMetadataXml(event.target.value)}
              rows={11}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100"
              placeholder="<EntityDescriptor>...</EntityDescriptor>"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">
          {error ? <span className="text-rose-300">{error}</span> : null}
          {message ? <span className="text-emerald-300">{message}</span> : null}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          Save SSO
        </button>
      </div>
    </section>
  );
}
