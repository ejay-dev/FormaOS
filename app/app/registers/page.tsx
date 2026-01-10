"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CreateAssetSheet } from "@/components/registers/create-asset-sheet";
import { DeleteButton } from "@/components/delete-button";
import { exportRegistersToPDF } from "@/lib/utils/export-helper";
import { Laptop, Database, Globe, Box, ShieldAlert, Download, Loader2, AlertTriangle } from "lucide-react";

export default function RegistersPage() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegisters();
  }, []);

  async function fetchRegisters() {
    try {
      const { data, error } = await supabase
        .from('org_registers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRegisters(data || []);
    } catch (err) {
      console.error("Error fetching registers:", err);
    } finally {
      setLoading(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'hardware': return <Laptop className="h-4 w-4" />;
      case 'software': return <Box className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'infrastructure': return <Globe className="h-4 w-4" />;
      default: return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-rose-500/10 text-red-700 border-rose-400/30';
      case 'medium': return 'bg-amber-400/10 text-amber-700 border-amber-400/30';
      default: return 'bg-emerald-400/10 text-emerald-700 border-emerald-400/30';
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Registers</h1>
          <p className="text-slate-400 text-sm">Monitor asset health and security risk levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportRegistersToPDF(registers, "FormaOS Organization")}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10 transition-all"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <CreateAssetSheet />
        </div>
      </div>

      <hr className="border-white/10" />

      {registers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white/5 p-20 text-center shadow-sm">
          <Database className="h-10 w-10 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-100">No assets registered</h3>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {registers.map((item) => (
            <div key={item.id} className="group p-5 bg-white/5 border border-white/10 rounded-xl shadow-sm hover:border-white/10 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-slate-100 transition-colors">
                    {getIcon(item.type || item.category)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase ${getRiskColor(item.risk_level)}`}>
                      {item.risk_level || 'LOW'} RISK
                    </span>
                    <DeleteButton id={item.id} tableName="org_registers" onDelete={fetchRegisters} />
                  </div>
                </div>
                <h3 className="font-bold text-slate-100 leading-tight">{item.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-medium uppercase tracking-wider">
                  {item.type || item.category || 'Uncategorized'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-1">
                   <AlertTriangle className={`h-3 w-3 ${item.risk_level === 'high' ? 'text-red-500' : 'text-slate-400'}`} />
                   <span className="text-[10px]">Security Status</span>
                </div>
                <span className="text-[10px] font-mono">#{item.id.slice(0, 6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}