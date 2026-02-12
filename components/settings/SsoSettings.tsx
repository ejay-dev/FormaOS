'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveOrgSsoConfigAction } from '@/app/app/settings/security/sso-actions';

type Props = {
  orgId: string;
  initial: {
    enabled: boolean;
    enforceSso: boolean;
    allowedDomains: string[];
    idpMetadataXml: string | null;
    idpEntityId: string | null;
    ssoUrl: string | null;
    certificatePresent: boolean;
  };
  sp: {
    metadataUrl: string;
    acsUrl: string;
  };
  spSigningAvailable: boolean;
};

function parseDomains(value: string): string[] {
  return value
    .split(/[\n, ]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function SsoSettings(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(Boolean(props.initial.enabled));
  const [enforce, setEnforce] = useState(Boolean(props.initial.enforceSso));
  const [domainsText, setDomainsText] = useState(
    (props.initial.allowedDomains ?? []).join('\n'),
  );
  const [metadataXml, setMetadataXml] = useState(props.initial.idpMetadataXml ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const domains = useMemo(() => parseDomains(domainsText), [domainsText]);

  const onSave = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveOrgSsoConfigAction({
        orgId: props.orgId,
        enabled,
        enforceSso: enforce,
        allowedDomains: domains,
        idpMetadataXml: metadataXml.trim() ? metadataXml.trim() : null,
      });

      if (!result?.ok) {
        setError(result?.error ?? 'Failed to save SSO settings.');
        return;
      }

      setMessage('SSO settings saved.');
    });
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-slate-100">Enterprise SSO (SAML)</h2>
        <p className="text-sm text-slate-400">
          Configure SAML SSO for your organization. This is a real Service Provider (SP) flow: metadata, login, ACS, and signed assertion validation.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Enable SAML SSO</div>
              <div className="text-xs text-slate-500">
                Turns on SSO endpoints for this org.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled((v) => !v)}
              className={`h-8 w-14 rounded-full border transition-colors ${
                enabled ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-slate-900 border-slate-700'
              }`}
              aria-pressed={enabled}
              disabled={isPending}
            >
              <span
                className={`block h-6 w-6 rounded-full transition-transform ${
                  enabled ? 'translate-x-7 bg-emerald-400' : 'translate-x-1 bg-slate-500'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-200">Enforce SSO</div>
              <div className="text-xs text-slate-500">
                When enabled, users on allowed domains should sign in via SSO instead of passwords.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnforce((v) => !v)}
              className={`h-8 w-14 rounded-full border transition-colors ${
                enforce ? 'bg-amber-500/20 border-amber-500/40' : 'bg-slate-900 border-slate-700'
              }`}
              aria-pressed={enforce}
              disabled={isPending || !enabled}
              title={!enabled ? 'Enable SSO first' : undefined}
            >
              <span
                className={`block h-6 w-6 rounded-full transition-transform ${
                  enforce ? 'translate-x-7 bg-amber-300' : 'translate-x-1 bg-slate-500'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Allowed email domains (one per line)
            </label>
            <textarea
              value={domainsText}
              onChange={(e) => setDomainsText(e.target.value)}
              rows={4}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
              placeholder={`example.com\nexample.org`}
              disabled={isPending}
            />
            <p className="mt-2 text-xs text-slate-500">
              If empty, domain checks are not enforced. Recommended: lock this to your corporate domains.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">SP Endpoints (give these to your IdP admin)</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Metadata</span>
                <code className="text-xs text-slate-200 break-all">{props.sp.metadataUrl}</code>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">ACS</span>
                <code className="text-xs text-slate-200 break-all">{props.sp.acsUrl}</code>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-xs font-semibold text-slate-300">Signing</div>
            <div className="text-xs text-slate-500 mt-1">
              {props.spSigningAvailable
                ? 'AuthnRequest signing is available (SP key configured).'
                : 'AuthnRequest signing is not configured. Assertions are still required to be signed by the IdP.'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              IdP metadata XML
            </label>
            <textarea
              value={metadataXml}
              onChange={(e) => setMetadataXml(e.target.value)}
              rows={8}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-mono"
              placeholder="<EntityDescriptor ...>...</EntityDescriptor>"
              disabled={isPending}
            />
            <p className="mt-2 text-xs text-slate-500">
              Paste the IdP metadata XML. FormaOS extracts issuer, SSO URL, and signing certificate from this document.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs">
          {error ? <span className="text-rose-300">{error}</span> : null}
          {message ? <span className="text-emerald-300">{message}</span> : null}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
        >
          Save SSO Settings
        </button>
      </div>
    </section>
  );
}

