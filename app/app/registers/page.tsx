"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { CreateAssetSheet } from "@/components/registers/create-asset-sheet";
import { DeleteButton } from "@/components/delete-button";
import { exportRegistersToPDF } from "@/lib/utils/export-helper";
import { useAppStore } from "@/lib/stores/app";
import Link from "next/link";
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
} from "lucide-react";

// Register type cards for care industries
const CARE_REGISTERS = [
  {
    id: "clients",
    title: "Client Register",
    description: "Complete list of all clients/participants with contact and status info",
    icon: Users,
    href: "/app/participants",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "incidents",
    title: "Incident Register",
    description: "All reported incidents with severity, status, and follow-up tracking",
    icon: AlertTriangle,
    href: "/app/incidents",
    color: "bg-red-500/10 text-red-600",
  },
  {
    id: "visits",
    title: "Service Register",
    description: "Service delivery logs, visits, and appointment records",
    icon: Calendar,
    href: "/app/visits",
    color: "bg-green-500/10 text-green-600",
  },
  {
    id: "staff",
    title: "Staff Compliance Register",
    description: "Staff credentials, qualifications, checks, and expiry tracking",
    icon: Shield,
    href: "/app/staff-compliance",
    color: "bg-purple-500/10 text-purple-600",
  },
];

export default function RegistersPage() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"care" | "assets">("care");

  const organization = useAppStore((state) => state.organization);
  const isCareIndustry =
    organization?.industry === "ndis" ||
    organization?.industry === "healthcare" ||
    organization?.industry === "aged_care";

  useEffect(() => {
    fetchRegisters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        .from("org_registers")
        .select("id, name, description, type, category, risk_level, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);

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
      case "hardware":
        return <Laptop className="h-4 w-4" />;
      case "software":
        return <Box className="h-4 w-4" />;
      case "data":
        return <Database className="h-4 w-4" />;
      case "infrastructure":
        return <Globe className="h-4 w-4" />;
      default:
        return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-rose-500/10 text-red-700 border-rose-400/30";
      case "medium":
        return "bg-amber-400/10 text-amber-700 border-amber-400/30";
      default:
        return "bg-emerald-400/10 text-emerald-700 border-emerald-400/30";
    }
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100" data-testid="registers-title">
            Registers
          </h1>
          <p className="text-slate-400 text-sm">
            {isCareIndustry
              ? "Access client, incident, service, and compliance registers"
              : "Monitor asset health and security risk levels."}
          </p>
        </div>
        {activeTab === "assets" && (
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
        )}
      </div>

      {/* Tabs for care industries */}
      {isCareIndustry && (
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("care")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "care"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Care Registers
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "assets"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            <Laptop className="h-4 w-4 inline mr-2" />
            Asset Registers
          </button>
        </div>
      )}

      {/* Care Registers Grid */}
      {isCareIndustry && activeTab === "care" && (
        <div className="grid gap-4 md:grid-cols-2" data-testid="care-registers-grid">
          {CARE_REGISTERS.map((register) => (
            <Link
              key={register.id}
              href={register.href}
              className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 hover:bg-white/8 transition-all"
              data-testid={`register-${register.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${register.color} flex items-center justify-center`}>
                    <register.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 group-hover:text-primary transition-colors">
                      {register.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{register.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Asset Registers (existing) */}
      {(!isCareIndustry || activeTab === "assets") && (
        <>
          <hr className="border-white/10" />

          {registers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white/5 p-20 text-center shadow-sm">
              <Database className="h-10 w-10 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-100">No assets registered</h3>
              <p className="text-sm text-muted-foreground mt-1">Add your first asset to start tracking</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {registers.map((item) => (
                <div
                  key={item.id}
                  className="group p-5 bg-white/5 border border-white/10 rounded-xl shadow-sm hover:border-white/10 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-slate-100 transition-colors">
                        {getIcon(item.type || item.category)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase ${getRiskColor(
                            item.risk_level
                          )}`}
                        >
                          {item.risk_level || "LOW"} RISK
                        </span>
                        <DeleteButton id={item.id} tableName="org_registers" onDelete={fetchRegisters} />
                      </div>
                    </div>

                    <h3 className="font-semibold text-slate-100 text-base mb-2">{item.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-muted-foreground">
                    <span>{item.category || item.type}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
