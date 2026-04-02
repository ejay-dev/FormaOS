'use client';

import { useState } from 'react';
import { Pill, Clock, AlertTriangle, Check, X, History } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  route: string;
  prescribed_by: string | null;
  start_date: string | null;
  end_date: string | null;
  instructions: string | null;
  precautions: string | null;
  is_prn: boolean;
  status: string;
}

interface Administration {
  id: string;
  medication_id: string;
  administered_at: string;
  dose_given: string | null;
  status: string;
  notes: string | null;
  administered_by?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  discontinued: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  on_hold:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

const ADMIN_STATUS_ICONS: Record<string, typeof Check> = {
  given: Check,
  withheld: X,
  refused: X,
  self_administered: Check,
};

export function MedicationChart({
  medications,
  administrations,
  participantId,
  orgId,
}: {
  medications: Medication[];
  administrations: Administration[];
  participantId: string;
  orgId: string;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'prn'>('active');
  const [showAdminForm, setShowAdminForm] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    dose_given: '',
    status: 'given' as string,
    notes: '',
  });

  const filtered = medications.filter((m) => {
    if (filter === 'active') return m.status === 'active';
    if (filter === 'prn') return m.is_prn && m.status === 'active';
    return true;
  });

  const getRecentAdmin = (medId: string) =>
    administrations
      .filter((a) => a.medication_id === medId)
      .sort((a, b) => b.administered_at.localeCompare(a.administered_at))
      .slice(0, 5);

  const handleAdminister = async (medId: string) => {
    try {
      await fetch(`/api/v1/medications/${medId}/administer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          org_id: orgId,
          ...adminForm,
        }),
      });
      setShowAdminForm(null);
      setAdminForm({ dose_given: '', status: 'given', notes: '' });
      window.location.reload();
    } catch {}
  };

  const activeMeds = medications.filter((m) => m.status === 'active');
  const prnMeds = medications.filter((m) => m.is_prn && m.status === 'active');

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <Pill className="h-4 w-4 text-muted-foreground" />
          <p className="mt-1 text-xl font-semibold">{activeMeds.length}</p>
          <p className="text-xs text-muted-foreground">Active Medications</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="mt-1 text-xl font-semibold">{prnMeds.length}</p>
          <p className="text-xs text-muted-foreground">PRN (As Needed)</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <p className="mt-1 text-xl font-semibold">{administrations.length}</p>
          <p className="text-xs text-muted-foreground">
            Administrations Logged
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border border-border p-1 w-fit">
        {(['active', 'prn', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 text-sm capitalize ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {f === 'prn' ? 'PRN' : f}
          </button>
        ))}
      </div>

      {/* Medication List */}
      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {filtered.map((med) => {
          const recentAdmins = getRecentAdmin(med.id);
          return (
            <div key={med.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{med.name}</h4>
                    {med.is_prn && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        PRN
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[med.status]}`}
                    >
                      {med.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {med.dosage && <span>Dosage: {med.dosage}</span>}
                    {med.frequency && <span>Frequency: {med.frequency}</span>}
                    <span className="capitalize">Route: {med.route}</span>
                    {med.prescribed_by && (
                      <span>Prescribed by: {med.prescribed_by}</span>
                    )}
                  </div>
                  {med.instructions && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Instructions: {med.instructions}
                    </p>
                  )}
                  {med.precautions && (
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {med.precautions}
                    </p>
                  )}
                </div>

                {med.status === 'active' && (
                  <button
                    onClick={() =>
                      setShowAdminForm(showAdminForm === med.id ? null : med.id)
                    }
                    className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Administer
                  </button>
                )}
              </div>

              {/* Administration Form */}
              {showAdminForm === med.id && (
                <div className="mt-3 rounded-md border border-border bg-muted/50 p-3 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Dose given"
                      value={adminForm.dose_given}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          dose_given: e.target.value,
                        })
                      }
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                    <select
                      value={adminForm.status}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, status: e.target.value })
                      }
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    >
                      <option value="given">Given</option>
                      <option value="withheld">Withheld</option>
                      <option value="refused">Refused</option>
                      <option value="self_administered">
                        Self-Administered
                      </option>
                    </select>
                    <input
                      type="text"
                      placeholder="Notes"
                      value={adminForm.notes}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, notes: e.target.value })
                      }
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdminister(med.id)}
                      className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                    >
                      Record
                    </button>
                    <button
                      onClick={() => setShowAdminForm(null)}
                      className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Administrations */}
              {recentAdmins.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Recent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentAdmins.map((a) => {
                      const Icon = ADMIN_STATUS_ICONS[a.status] ?? Check;
                      return (
                        <span
                          key={a.id}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                            a.status === 'given' ||
                            a.status === 'self_administered'
                              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                          }`}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {new Date(a.administered_at).toLocaleDateString()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No medications found.
          </div>
        )}
      </div>
    </div>
  );
}
