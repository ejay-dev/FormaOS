"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { 
  Shield, FileCheck, BarChart3, Lock, Zap, AlertTriangle, 
  Check, Loader2, ArrowRight, Users, Settings, Crown 
} from "lucide-react";

/**
 * =========================================================
 * NODE/WIRE PRODUCT LOGIC SYSTEM
 * =========================================================
 * Real compliance visualization tied to:
 * - Plan tier (trial/basic/pro/enterprise)
 * - Enabled modules
 * - User role (Viewer/Member/Admin/Owner)
 * - Feature access logic
 */

export type PlanTier = "trial" | "basic" | "pro" | "enterprise";
export type UserRole = "viewer" | "member" | "admin" | "owner";
export type NodeStatus = "active" | "locked" | "preview" | "processing" | "restricted" | "upgrade";

export interface ModuleNode {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  status: NodeStatus;
  requiredPlan: PlanTier;
  description: string;
}

export interface WireConnection {
  from: string;
  to: string;
  active: boolean;
  animating: boolean;
  label?: string;
}

interface NodeWireSystemProps {
  plan?: PlanTier;
  role?: UserRole;
  enabledModules?: string[];
  onNodeClick?: (nodeId: string) => void;
  onUpgradeClick?: () => void;
  compact?: boolean;
  className?: string;
}

// Module definitions with plan requirements
const MODULES: ModuleNode[] = [
  { id: "controls", name: "Controls", icon: Shield, color: "rgb(56, 189, 248)", requiredPlan: "trial", description: "Manage compliance controls" },
  { id: "evidence", name: "Evidence", icon: FileCheck, color: "rgb(139, 92, 246)", requiredPlan: "trial", description: "Store artifacts securely" },
  { id: "tasks", name: "Tasks", icon: Zap, color: "rgb(6, 182, 212)", requiredPlan: "trial", description: "Assign and track work" },
  { id: "audits", name: "Audits", icon: BarChart3, color: "rgb(34, 197, 94)", requiredPlan: "basic", description: "Export audit bundles" },
  { id: "policies", name: "Policies", icon: Lock, color: "rgb(236, 72, 153)", requiredPlan: "basic", description: "Version-controlled library" },
  { id: "analytics", name: "Analytics", icon: BarChart3, color: "rgb(245, 158, 11)", requiredPlan: "pro", description: "Advanced insights" },
  { id: "automation", name: "Automation", icon: Settings, color: "rgb(99, 102, 241)", requiredPlan: "pro", description: "Workflow automation" },
  { id: "governance", name: "Governance", icon: Crown, color: "rgb(168, 85, 247)", requiredPlan: "enterprise", description: "Full governance suite" },
];

// Plan hierarchy for access control
const PLAN_HIERARCHY: Record<PlanTier, number> = {
  trial: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

function getNodeStatus(module: ModuleNode, plan: PlanTier, enabledModules: string[]): NodeStatus {
  const planLevel = PLAN_HIERARCHY[plan];
  const requiredLevel = PLAN_HIERARCHY[module.requiredPlan];
  
  if (planLevel >= requiredLevel) {
    return enabledModules.includes(module.id) ? "active" : "preview";
  }
  
  if (planLevel === requiredLevel - 1) {
    return "upgrade";
  }
  
  return "locked";
}

// Animated node component
function AnimatedNode({ 
  module, 
  status, 
  onClick, 
  index,
  compact 
}: { 
  module: ModuleNode; 
  status: NodeStatus; 
  onClick?: () => void; 
  index: number;
  compact?: boolean;
}) {
  const Icon = module.icon;
  const size = compact ? "w-12 h-12" : "w-16 h-16";
  const iconSize = compact ? "h-5 w-5" : "h-6 w-6";

  const statusStyles = {
    active: "border-2 border-current shadow-[0_0_20px_currentColor]",
    locked: "opacity-40 border border-white/10 grayscale",
    preview: "border border-dashed border-current opacity-70",
    processing: "border-2 border-current animate-pulse",
    restricted: "border border-rose-500/50 opacity-50",
    upgrade: "border border-current border-dashed opacity-60 cursor-pointer hover:opacity-100",
  };

  const statusIcons = {
    locked: <Lock className="h-3 w-3 absolute -top-1 -right-1 text-white/50" />,
    upgrade: <ArrowRight className="h-3 w-3 absolute -top-1 -right-1 text-amber-400" />,
    processing: <Loader2 className="h-3 w-3 absolute -top-1 -right-1 animate-spin" />,
    active: <Check className="h-3 w-3 absolute -top-1 -right-1 text-emerald-400" />,
    restricted: <AlertTriangle className="h-3 w-3 absolute -top-1 -right-1 text-rose-400" />,
    preview: null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
      whileHover={status !== "locked" ? { scale: 1.1 } : undefined}
      whileTap={status !== "locked" ? { scale: 0.95 } : undefined}
      onClick={onClick}
      className={`relative flex flex-col items-center cursor-pointer group`}
    >
      {/* Node circle */}
      <div
        className={`
          ${size} rounded-full flex items-center justify-center 
          transition-all duration-300 relative
          ${statusStyles[status]}
        `}
        style={{ 
          color: module.color,
          backgroundColor: status === "active" ? `${module.color}20` : "transparent"
        }}
      >
        {/* Glow effect for active nodes */}
        {status === "active" && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: module.color, filter: "blur(12px)" }}
          />
        )}
        
        <Icon className={`${iconSize} relative z-10`} style={{ color: module.color }} />
        
        {/* Status indicator */}
        {statusIcons[status]}
      </div>

      {/* Label */}
      <motion.span
        className="mt-2 text-xs font-medium text-center transition-colors"
        style={{ color: status === "active" ? module.color : "rgba(255,255,255,0.6)" }}
      >
        {module.name}
      </motion.span>

      {/* Tooltip on hover */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg glass-intense text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50"
        >
          {module.description}
          {status === "upgrade" && (
            <span className="block text-amber-400 mt-1">Click to upgrade</span>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// Animated wire/connection
function AnimatedWire({ 
  from, 
  to, 
  active, 
  animating,
  modulePositions 
}: { 
  from: string; 
  to: string; 
  active: boolean; 
  animating: boolean;
  modulePositions: Record<string, { x: number; y: number }>;
}) {
  const fromPos = modulePositions[from];
  const toPos = modulePositions[to];
  
  if (!fromPos || !toPos) return null;

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  return (
    <motion.svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`wire-${from}-${to}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={active ? "rgb(56, 189, 248)" : "rgba(255,255,255,0.1)"} />
          <stop offset="50%" stopColor={active ? "rgb(139, 92, 246)" : "rgba(255,255,255,0.2)"} />
          <stop offset="100%" stopColor={active ? "rgb(6, 182, 212)" : "rgba(255,255,255,0.1)"} />
        </linearGradient>
      </defs>
      
      <motion.line
        x1={fromPos.x}
        y1={fromPos.y}
        x2={toPos.x}
        y2={toPos.y}
        stroke={`url(#wire-${from}-${to})`}
        strokeWidth={active ? 2 : 1}
        strokeDasharray={active ? "none" : "4 4"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: 1, 
          opacity: active ? 0.8 : 0.2,
        }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />

      {/* Animated particle on active wires */}
      {animating && active && (
        <motion.circle
          r="3"
          fill="rgb(56, 189, 248)"
          style={{ filter: "blur(2px)" }}
          animate={{
            cx: [fromPos.x, toPos.x],
            cy: [fromPos.y, toPos.y],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </motion.svg>
  );
}

// Main NodeWire System Component
export function NodeWireSystem({
  plan = "trial",
  role = "member",
  enabledModules = ["controls", "evidence", "tasks"],
  onNodeClick,
  onUpgradeClick,
  compact = false,
  className = "",
}: NodeWireSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modulePositions, setModulePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate node statuses based on plan and enabled modules
  const nodesWithStatus = useMemo(() => {
    return MODULES.map(module => ({
      ...module,
      status: getNodeStatus(module, plan, enabledModules),
    }));
  }, [plan, enabledModules]);

  // Generate wire connections
  const wires = useMemo((): WireConnection[] => {
    const connections: WireConnection[] = [
      { from: "controls", to: "evidence", active: true, animating: true },
      { from: "evidence", to: "tasks", active: true, animating: true },
      { from: "tasks", to: "audits", active: plan !== "trial", animating: false },
      { from: "audits", to: "policies", active: plan !== "trial", animating: false },
      { from: "policies", to: "analytics", active: plan === "pro" || plan === "enterprise", animating: false },
      { from: "analytics", to: "automation", active: plan === "pro" || plan === "enterprise", animating: false },
      { from: "automation", to: "governance", active: plan === "enterprise", animating: false },
    ];
    return connections;
  }, [plan]);

  // Calculate positions on mount
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const nodes = container.querySelectorAll("[data-node-id]");
    const positions: Record<string, { x: number; y: number }> = {};
    
    nodes.forEach((node) => {
      const id = node.getAttribute("data-node-id");
      if (id) {
        const rect = node.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        positions[id] = {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      }
    });
    
    setModulePositions(positions);
  }, [nodesWithStatus]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Wires layer */}
      <div className="absolute inset-0">
        {Object.keys(modulePositions).length > 0 && wires.map((wire, idx) => (
          <AnimatedWire
            key={`${wire.from}-${wire.to}`}
            {...wire}
            modulePositions={modulePositions}
          />
        ))}
      </div>

      {/* Nodes grid */}
      <div className={`relative z-10 grid ${compact ? "grid-cols-4 gap-4" : "grid-cols-4 gap-8"}`}>
        {nodesWithStatus.map((module, index) => (
          <div 
            key={module.id}
            data-node-id={module.id}
            onMouseEnter={() => setHoveredNode(module.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <AnimatedNode
              module={module}
              status={module.status}
              index={index}
              compact={compact}
              onClick={() => {
                if (module.status === "upgrade" && onUpgradeClick) {
                  onUpgradeClick();
                } else if (onNodeClick) {
                  onNodeClick(module.id);
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Plan indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-2 text-xs">
          <span className="text-muted-foreground">Current Plan:</span>
          <span className="font-semibold capitalize" style={{ 
            color: plan === "enterprise" ? "rgb(168, 85, 247)" :
                   plan === "pro" ? "rgb(56, 189, 248)" :
                   plan === "basic" ? "rgb(34, 197, 94)" : "rgb(245, 158, 11)"
          }}>
            {plan}
          </span>
          {plan === "trial" && (
            <button 
              onClick={onUpgradeClick}
              className="ml-2 px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Simplified version for marketing pages
export function NodeWireShowcase({ className = "" }: { className?: string }) {
  return (
    <NodeWireSystem
      plan="pro"
      enabledModules={["controls", "evidence", "tasks", "audits", "policies", "analytics"]}
      compact={false}
      className={className}
    />
  );
}

export default NodeWireSystem;
