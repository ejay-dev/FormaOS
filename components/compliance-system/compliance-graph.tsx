"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ComplianceNode, NodeType, NodeState } from "./compliance-node";
import { ComplianceWire, ComplianceWireVertical, WireType } from "./compliance-wire";

/**
 * =========================================================
 * COMPLIANCE GRAPH COMPONENT
 * =========================================================
 * Visual representation of the compliance lifecycle:
 * Policy → Control → Evidence → Audit → Risk → Task → Control (loop)
 * 
 * This shows the interconnected nature of the compliance system.
 */

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  count?: number;
  state?: NodeState;
}

interface GraphConnection {
  from: string;
  to: string;
  wireType: WireType;
  animate?: boolean;
}

interface ComplianceGraphProps {
  nodes: GraphNode[];
  connections?: GraphConnection[];
  layout?: "horizontal" | "vertical" | "radial" | "lifecycle";
  className?: string;
  onNodeClick?: (nodeId: string) => void;
  showLabels?: boolean;
}

/**
 * Full lifecycle flow visualization
 */
export function ComplianceGraph({
  nodes,
  connections,
  layout = "lifecycle",
  className,
  onNodeClick,
  showLabels = true,
}: ComplianceGraphProps) {
  if (layout === "lifecycle") {
    return <LifecycleGraph nodes={nodes} onNodeClick={onNodeClick} className={className} />;
  }

  if (layout === "horizontal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <ComplianceNode
              type={node.type}
              label={node.label}
              sublabel={node.sublabel}
              count={node.count}
              state={node.state}
              onClick={() => onNodeClick?.(node.id)}
              size="sm"
            />
            {i < nodes.length - 1 && connections?.[i] && (
              <ComplianceWire
                type={connections[i].wireType}
                animate={connections[i].animate}
                className="w-12"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (layout === "vertical") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        {nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <ComplianceNode
              type={node.type}
              label={node.label}
              sublabel={node.sublabel}
              count={node.count}
              state={node.state}
              onClick={() => onNodeClick?.(node.id)}
              size="md"
            />
            {i < nodes.length - 1 && connections?.[i] && (
              <ComplianceWireVertical
                type={connections[i].wireType}
                animate={connections[i].animate}
                className="h-8"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Radial layout - center node with surrounding connections
  return (
    <div className={cn("relative", className)} style={{ minHeight: 400 }}>
      {/* Center node */}
      {nodes[0] && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ComplianceNode
            type={nodes[0].type}
            label={nodes[0].label}
            state={nodes[0].state}
            size="lg"
            onClick={() => onNodeClick?.(nodes[0].id)}
          />
        </div>
      )}
      
      {/* Surrounding nodes */}
      {nodes.slice(1).map((node, i) => {
        const angle = (i / (nodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
        const radius = 150;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <div
            key={node.id}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
            }}
          >
            <ComplianceNode
              type={node.type}
              label={node.label}
              state={node.state}
              size="sm"
              onClick={() => onNodeClick?.(node.id)}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Standard compliance lifecycle visualization
 * Shows: Policy → Control → Evidence → Audit → Risk → Task (loop back to Control)
 */
function LifecycleGraph({ 
  nodes, 
  onNodeClick,
  className 
}: { 
  nodes: GraphNode[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}) {
  // Define the standard lifecycle order
  const lifecycleOrder: NodeType[] = ["policy", "control", "evidence", "audit", "risk", "task"];
  
  // Map nodes to lifecycle positions
  const orderedNodes = lifecycleOrder.map(type => 
    nodes.find(n => n.type === type) || {
      id: type,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count: 0,
      state: "idle" as NodeState,
    }
  );

  const wireTypes: WireType[] = [
    "policy-control",
    "control-evidence",
    "evidence-audit",
    "audit-risk",
    "risk-task",
  ];

  return (
    <div className={cn("relative", className)}>
      {/* Desktop: Horizontal layout */}
      <div className="hidden lg:flex items-center justify-center gap-1">
        {orderedNodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <ComplianceNode
              type={node.type}
              label={node.label}
              sublabel={node.sublabel}
              count={node.count}
              state={node.state}
              onClick={() => onNodeClick?.(node.id)}
              size="md"
            />
            {i < orderedNodes.length - 1 && (
              <ComplianceWire
                type={wireTypes[i]}
                state={(node.state === "active" || orderedNodes[i + 1]?.state === "active") ? "active" : "idle"}
                className="w-8 lg:w-12"
              />
            )}
          </React.Fragment>
        ))}
        
        {/* Loop back indicator */}
        <div className="relative ml-2">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 border-r-2 border-t-2 border-emerald-400/60 rounded-tr-xl" />
          <div className="absolute -left-4 bottom-0 w-8 h-12 border-r-2 border-b-2 border-emerald-400/60 rounded-br-xl" />
          <div className="absolute -left-20 bottom-0 w-16 border-b-2 border-emerald-400/60" style={{ borderStyle: "dashed" }} />
        </div>
      </div>

      {/* Mobile: Vertical layout */}
      <div className="lg:hidden flex flex-col items-center gap-1">
        {orderedNodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <ComplianceNode
              type={node.type}
              label={node.label}
              count={node.count}
              state={node.state}
              onClick={() => onNodeClick?.(node.id)}
              size="sm"
              className="w-full max-w-[280px]"
            />
            {i < orderedNodes.length - 1 && (
              <ComplianceWireVertical
                type={wireTypes[i]}
                state={(node.state === "active" || orderedNodes[i + 1]?.state === "active") ? "active" : "idle"}
                className="h-6"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Mini lifecycle indicator for cards/headers
 */
export function LifecycleMini({
  activeTypes = [],
  className,
}: {
  activeTypes?: NodeType[];
  className?: string;
}) {
  const types: NodeType[] = ["policy", "control", "evidence", "audit", "risk", "task"];
  
  const colors: Record<NodeType, string> = {
    policy: "bg-cyan-400",
    control: "bg-teal-400",
    evidence: "bg-violet-400",
    audit: "bg-amber-400",
    risk: "bg-rose-400",
    task: "bg-emerald-400",
    entity: "bg-slate-400",
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {types.map((type, i) => (
        <React.Fragment key={type}>
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              activeTypes.includes(type) 
                ? colors[type]
                : "bg-white/20"
            )}
            title={type}
          />
          {i < types.length - 1 && (
            <div className={cn(
              "h-px w-2",
              activeTypes.includes(type) && activeTypes.includes(types[i + 1])
                ? "bg-white/40"
                : "bg-white/10"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default ComplianceGraph;
