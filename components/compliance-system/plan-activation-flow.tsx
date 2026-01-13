"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Check, 
  ArrowRight, 
  Loader2, 
  Shield, 
  FileCheck, 
  History,
  Database,
  Users,
  Sparkles
} from "lucide-react";
import { useSystemState } from "@/lib/system-state";
import { PlanTier, PLAN_FEATURES } from "@/lib/system-state/types";
import { useComplianceAction } from "@/components/compliance-system";

/**
 * =========================================================
 * PLAN ACTIVATION FLOW COMPONENT
 * =========================================================
 * Visualizes plan upgrade with node activation animation.
 * Shows wires connecting from plan → modules as they unlock.
 */

interface PlanCardProps {
  plan: PlanTier;
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
  current?: boolean;
  onSelect: () => void;
  isUpgrading?: boolean;
}

function PlanCard({
  plan,
  name,
  price,
  features,
  recommended,
  current,
  onSelect,
  isUpgrading,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border-2 p-6 transition-all duration-300",
        recommended
          ? "border-cyan-400/50 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          : "border-white/10 bg-white/5",
        current && "border-emerald-400/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
        !current && !isUpgrading && "hover:border-white/20 hover:bg-white/10 cursor-pointer"
      )}
      onClick={() => !current && !isUpgrading && onSelect()}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
            Recommended
          </div>
        </div>
      )}

      {current && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1">
            <Check className="h-3 w-3" />
            Current Plan
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-black text-slate-100">{name}</h3>
        <p className="text-3xl font-black text-white mt-2">{price}</p>
        <p className="text-xs text-slate-400 mt-1">per month</p>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        disabled={current || isUpgrading}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm transition-all",
          "flex items-center justify-center gap-2",
          current
            ? "bg-emerald-500/20 text-emerald-300 cursor-default"
            : recommended
            ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:brightness-110 active:scale-95"
            : "bg-white/10 text-white hover:bg-white/20 active:scale-95",
          isUpgrading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isUpgrading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Activating...
          </>
        ) : current ? (
          "Active"
        ) : (
          <>
            Select Plan
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

interface ModuleActivationProps {
  modules: string[];
  isActive: boolean;
  isActivating: boolean;
}

function ModuleActivationDisplay({ modules, isActive, isActivating }: ModuleActivationProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      {modules.slice(0, 5).map((module, i) => (
        <div
          key={module}
          className={cn(
            "h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
            isActive
              ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
              : isActivating
              ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-400 animate-pulse"
              : "border-white/10 bg-white/5 text-slate-500"
          )}
          style={{
            transitionDelay: `${i * 100}ms`,
          }}
        >
          {module === "controls" && <Shield className="h-5 w-5" />}
          {module === "evidence" && <FileCheck className="h-5 w-5" />}
          {module === "audits" && <History className="h-5 w-5" />}
          {module === "registers" && <Database className="h-5 w-5" />}
          {module === "team" && <Users className="h-5 w-5" />}
        </div>
      ))}
    </div>
  );
}

export function PlanActivationFlow() {
  const { state, upgradePlan, getPlan } = useSystemState();
  const { reportSuccess, reportInfo } = useComplianceAction();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [activatingPlan, setActivatingPlan] = useState<PlanTier | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentPlan = getPlan();

  const handlePlanSelect = useCallback(async (plan: PlanTier) => {
    if (plan === currentPlan) return;

    setIsUpgrading(true);
    setActivatingPlan(plan);

    try {
      reportInfo({ title: "Upgrading plan", message: "Configuring compliance engine..." });
      
      await upgradePlan(plan);
      
      setShowSuccess(true);
      reportSuccess({ 
        title: "Plan activated", 
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} features unlocked`,
        impactArea: "System access",
        impactDelta: 20
      });

      setTimeout(() => {
        setShowSuccess(false);
        setActivatingPlan(null);
      }, 2000);
    } catch (error) {
      console.error("Plan upgrade failed:", error);
    } finally {
      setIsUpgrading(false);
    }
  }, [currentPlan, upgradePlan, reportSuccess, reportInfo]);

  const plans: Array<{
    plan: PlanTier;
    name: string;
    price: string;
    features: string[];
    recommended?: boolean;
  }> = [
    {
      plan: "basic",
      name: "Starter",
      price: "$49",
      features: [
        "Core compliance controls",
        "Evidence collection",
        "Policy management",
        "Basic vault storage",
      ],
    },
    {
      plan: "pro",
      name: "Professional",
      price: "$149",
      features: [
        "Everything in Starter",
        "Audit trail & history",
        "Advanced reporting",
        "Team management",
        "Priority support",
      ],
      recommended: true,
    },
    {
      plan: "enterprise",
      name: "Enterprise",
      price: "$399",
      features: [
        "Everything in Pro",
        "Asset registers",
        "Training registers",
        "Admin dashboard",
        "Custom integrations",
        "Dedicated support",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(52,211,153,0.4)]">
              <Sparkles className="h-12 w-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white">Compliance Engine Activated</h2>
            <p className="text-slate-400 mt-2">All modules are now online</p>
            
            {/* Module activation visualization */}
            <ModuleActivationDisplay 
              modules={PLAN_FEATURES[activatingPlan || "pro"]}
              isActive={true}
              isActivating={false}
            />
          </div>
        </div>
      )}

      {/* Activating Animation */}
      {isUpgrading && !showSuccess && (
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-300">Configuring Compliance Engine...</h3>
              <p className="text-sm text-cyan-400/70">Activating modules and permissions</p>
            </div>
          </div>
          
          <ModuleActivationDisplay 
            modules={PLAN_FEATURES[activatingPlan || "pro"]}
            isActive={false}
            isActivating={true}
          />
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(planConfig => (
          <PlanCard
            key={planConfig.plan}
            {...planConfig}
            current={currentPlan === planConfig.plan}
            onSelect={() => handlePlanSelect(planConfig.plan)}
            isUpgrading={isUpgrading}
          />
        ))}
      </div>

      {/* Trial Notice */}
      {currentPlan === "trial" && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300">Trial Mode Active</h3>
              <p className="text-sm text-amber-400/70 mt-1">
                You have access to core features. Select a plan to unlock all modules and remove trial limitations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
