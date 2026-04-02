'use client';

import { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';

const MODULES = [
  'tasks',
  'evidence',
  'compliance',
  'incidents',
  'reports',
  'team',
  'billing',
  'settings',
  'forms',
  'care_plans',
  'audit',
  'policies',
  'integrations',
];

const ACTIONS = ['read', 'write', 'delete', 'export', 'admin'];

type Matrix = Record<string, Record<string, boolean>>;

interface Props {
  initialPermissions: Matrix;
  onSave: (permissions: Matrix) => void;
  roleName: string;
}

const PRESETS: Record<string, Matrix> = {
  'Full Admin': Object.fromEntries(
    MODULES.map((m) => [m, Object.fromEntries(ACTIONS.map((a) => [a, true]))]),
  ),
  'Read Only': Object.fromEntries(
    MODULES.map((m) => [
      m,
      { read: true, write: false, delete: false, export: false, admin: false },
    ]),
  ),
  'Standard Member': Object.fromEntries(
    MODULES.map((m) => [
      m,
      { read: true, write: true, delete: false, export: true, admin: false },
    ]),
  ),
  Auditor: Object.fromEntries(
    MODULES.map((m) => [
      m,
      {
        read: [
          'compliance',
          'evidence',
          'audit',
          'policies',
          'reports',
        ].includes(m),
        write: false,
        delete: false,
        export: ['compliance', 'evidence', 'audit', 'reports'].includes(m),
        admin: false,
      },
    ]),
  ),
};

export function RoleEditor({ initialPermissions, onSave, roleName }: Props) {
  const [permissions, setPermissions] = useState<Matrix>(initialPermissions);

  const toggle = (mod: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod]?.[action] },
    }));
  };

  const toggleColumn = (action: string) => {
    const allEnabled = MODULES.every((m) => permissions[m]?.[action]);
    setPermissions((prev) => {
      const next = { ...prev };
      for (const mod of MODULES) {
        next[mod] = { ...next[mod], [action]: !allEnabled };
      }
      return next;
    });
  };

  const toggleRow = (mod: string) => {
    const allEnabled = ACTIONS.every((a) => permissions[mod]?.[a]);
    setPermissions((prev) => ({
      ...prev,
      [mod]: Object.fromEntries(ACTIONS.map((a) => [a, !allEnabled])),
    }));
  };

  const applyPreset = (preset: string) => {
    if (PRESETS[preset]) setPermissions(structuredClone(PRESETS[preset]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{roleName}</h3>
        </div>
        <div className="flex gap-2">
          {Object.keys(PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className="px-2 py-1 text-[10px] rounded border border-border text-muted-foreground hover:bg-muted"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 text-xs font-medium text-muted-foreground border-b border-border">
                Module
              </th>
              {ACTIONS.map((action) => (
                <th
                  key={action}
                  className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border cursor-pointer hover:text-foreground"
                  onClick={() => toggleColumn(action)}
                >
                  {action}
                </th>
              ))}
              <th className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-border">
                All
              </th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => (
              <tr key={mod} className="hover:bg-muted/30">
                <td className="p-2 text-xs font-medium text-foreground capitalize border-b border-border">
                  {mod.replace('_', ' ')}
                </td>
                {ACTIONS.map((action) => (
                  <td
                    key={action}
                    className="p-2 text-center border-b border-border"
                  >
                    <button
                      onClick={() => toggle(mod, action)}
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        permissions[mod]?.[action]
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {permissions[mod]?.[action] ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </td>
                ))}
                <td className="p-2 text-center border-b border-border">
                  <button
                    onClick={() => toggleRow(mod)}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onSave(permissions)}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Save Permissions
        </button>
      </div>
    </div>
  );
}
