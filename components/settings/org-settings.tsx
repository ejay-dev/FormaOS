'use client';

import { useState } from 'react';
import { Palette, Globe, Mail, Image } from 'lucide-react';

interface Branding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_domain?: string;
  login_message?: string;
  email_footer?: string;
}

export function BrandingEditor({
  branding,
  onSave,
}: {
  branding: Branding;
  onSave: (data: Branding) => void;
}) {
  const [form, setForm] = useState<Branding>(branding);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            <Palette className="h-3 w-3 inline mr-1" /> Primary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.primary_color || '#6366f1'}
              onChange={(e) =>
                setForm((p) => ({ ...p, primary_color: e.target.value }))
              }
              className="h-9 w-12 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={form.primary_color || '#6366f1'}
              onChange={(e) =>
                setForm((p) => ({ ...p, primary_color: e.target.value }))
              }
              className="flex-1 px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Secondary Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={form.secondary_color || '#8b5cf6'}
              onChange={(e) =>
                setForm((p) => ({ ...p, secondary_color: e.target.value }))
              }
              className="h-9 w-12 border border-border rounded cursor-pointer"
            />
            <input
              type="text"
              value={form.secondary_color || '#8b5cf6'}
              onChange={(e) =>
                setForm((p) => ({ ...p, secondary_color: e.target.value }))
              }
              className="flex-1 px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          <Image className="h-3 w-3 inline mr-1" /> Logo URL
        </label>
        <input
          type="url"
          value={form.logo_url || ''}
          onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
          placeholder="https://example.com/logo.png"
          className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          <Globe className="h-3 w-3 inline mr-1" /> Custom Domain
        </label>
        <input
          type="text"
          value={form.custom_domain || ''}
          onChange={(e) =>
            setForm((p) => ({ ...p, custom_domain: e.target.value }))
          }
          placeholder="compliance.acme.com"
          className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Login Page Message
        </label>
        <textarea
          value={form.login_message || ''}
          onChange={(e) =>
            setForm((p) => ({ ...p, login_message: e.target.value }))
          }
          rows={2}
          placeholder="Welcome to our compliance portal"
          className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          <Mail className="h-3 w-3 inline mr-1" /> Email Footer
        </label>
        <input
          type="text"
          value={form.email_footer || ''}
          onChange={(e) =>
            setForm((p) => ({ ...p, email_footer: e.target.value }))
          }
          placeholder="© 2026 Acme Corp. All rights reserved."
          className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
        />
      </div>

      <button
        onClick={() => onSave(form)}
        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Save Branding
      </button>
    </div>
  );
}

interface FeatureToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function FeatureToggles({
  features,
  onToggle,
}: {
  features: FeatureToggle[];
  onToggle: (key: string, enabled: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {features.map((f) => (
        <div
          key={f.key}
          className="flex items-center justify-between p-3 rounded-lg border border-border"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{f.label}</p>
            <p className="text-xs text-muted-foreground">{f.description}</p>
          </div>
          <button
            onClick={() => onToggle(f.key, !f.enabled)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              f.enabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                f.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

export function DangerZone({
  orgName,
  onExport,
  onDelete,
}: {
  orgName: string;
  onExport: () => void;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState('');

  return (
    <div className="rounded-lg border-2 border-red-300 dark:border-red-700 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Export All Data</p>
          <p className="text-xs text-muted-foreground">
            Download a JSON export of all organization data
          </p>
        </div>
        <button
          onClick={onExport}
          className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
        >
          Export
        </button>
      </div>

      <div className="border-t border-red-200 dark:border-red-800 pt-4">
        <p className="text-sm font-medium text-foreground">
          Delete Organization
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          This action cannot be undone. Type <strong>{orgName}</strong> to
          confirm.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            placeholder={orgName}
            className="flex-1 px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded bg-background text-foreground"
          />
          <button
            disabled={confirmDelete !== orgName || !onDelete}
            onClick={onDelete}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
