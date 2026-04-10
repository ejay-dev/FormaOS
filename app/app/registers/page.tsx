'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { CreateAssetSheet } from '@/components/registers/create-asset-sheet';
import { DeleteButton } from '@/components/delete-button';
import { exportRegistersToPDF } from '@/lib/utils/export-helper';
import { useAppStore } from '@/lib/stores/app';
import Link from 'next/link';
import {
  Laptop,
  Database,
  Globe,
  Box,
  ShieldAlert,
  Download,
  Loader2,
  Users,
  AlertTriangle,
  Calendar,
  Shield,
  FileText,
  ChevronRight,
} from 'lucide-react';

// Register type cards for care industries
const CARE_REGISTERS = [
  {
    id: 'clients',
    title: 'Client Register',
    description:
      'Complete list of all clients/participants with contact and status info',
    icon: Users,
    href: '/app/participants',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'incidents',
    title: 'Incident Register',
    description:
      'All reported incidents with severity, status, and follow-up tracking',
    icon: AlertTriangle,
    href: '/app/incidents',
    color: 'bg-red-500/10 text-red-600',
  },
  {
    id: 'visits',
    title: 'Service Register',
    description: 'Service delivery logs, visits, and appointment records',
    icon: Calendar,
    href: '/app/visits',
    color: 'bg-green-500/10 text-green-600',
  },
  {
    id: 'staff',
    title: 'Staff Compliance Register',
    description:
      'Staff credentials, qualifications, checks, and expiry tracking',
    icon: Shield,
    href: '/app/staff-compliance',
    color: 'bg-purple-500/10 text-purple-600',
  },
];

export default function RegistersPage() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'care' | 'assets'>('care');

  const organization = useAppStore((state) => state.organization);
  const isCareIndustry =
    organization?.industry === 'ndis' ||
    organization?.industry === 'healthcare' ||
    organization?.industry === 'aged_care';

  useEffect(() => {
    fetchRegisters();
  }, [organization?.id]);

  async function fetchRegisters() {
    try {
      const orgId = organization?.id;
      if (!orgId) {
        setRegisters([]);
        return;
      }
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('org_registers')
        .select('id, name, description, type, category, risk_level, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRegisters(data || []);
    } catch (err) {
      console.error('Error fetching registers:', err);
    } finally {
      setLoading(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'hardware':
        return <Laptop className="h-4 w-4" />;
      case 'software':
        return <Box className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'infrastructure':
        return <Globe className="h-4 w-4" />;
      default:
        return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const _getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-rose-500/10 text-red-700 border-rose-400/30';
      case 'medium':
        return 'bg-amber-400/10 text-amber-700 border-amber-400/30';
      default:
        return 'bg-emerald-400/10 text-emerald-700 border-emerald-400/30';
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="registers-title">
            Registers
          </h1>
          <p className="page-description">
            {isCareIndustry
              ? 'Access client, incident, service, and compliance registers'
              : 'Monitor asset health and security risk levels'}
          </p>
        </div>
        {activeTab === 'assets' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                exportRegistersToPDF(registers, 'FormaOS Organization')
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-sm hover:bg-accent/30 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <CreateAssetSheet />
          </div>
        )}
      </div>

      <div className="page-content space-y-4">
        {isCareIndustry && (
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('care')}
              className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'care'
                  ? 'bg-accent/50 text-foreground'
                  : 'text-muted-foreground hover:bg-accent/30'
              }`}
            >
              <FileText className="h-3.5 w-3.5 inline mr-1.5" />
              Care
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'assets'
                  ? 'bg-accent/50 text-foreground'
                  : 'text-muted-foreground hover:bg-accent/30'
              }`}
            >
              <Laptop className="h-3.5 w-3.5 inline mr-1.5" />
              Assets
            </button>
          </div>
        )}

        {/* Care Registers Grid */}
        {isCareIndustry && activeTab === 'care' && (
          <div
            className="grid gap-3 md:grid-cols-2"
            data-testid="care-registers-grid"
          >
            {CARE_REGISTERS.map((register) => (
              <Link
                key={register.id}
                href={register.href}
                className="group flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                data-testid={`register-${register.id}`}
              >
                <div
                  className={`h-9 w-9 rounded-lg ${register.color} flex items-center justify-center shrink-0`}
                >
                  <register.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {register.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {register.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Asset Registers (existing) */}
        {(!isCareIndustry || activeTab === 'assets') && (
          <>
            {registers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                <Database className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No assets registered
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {registers.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 border border-border rounded-lg bg-card flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                          {getIcon(item.type || item.category)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`status-pill ${
                              item.risk_level?.toLowerCase() === 'high'
                                ? 'status-pill-red'
                                : item.risk_level?.toLowerCase() === 'medium'
                                  ? 'status-pill-amber'
                                  : 'status-pill-green'
                            }`}
                          >
                            {item.risk_level || 'LOW'}
                          </span>
                          <DeleteButton
                            id={item.id}
                            tableName="org_registers"
                            onDelete={fetchRegisters}
                          />
                        </div>
                      </div>

                      <h3 className="text-sm font-medium mb-1">{item.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                      <span>{item.category || item.type}</span>
                      <span>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
