"use client";

import { motion } from "framer-motion";
import { Activity, Shield, FileCheck, TrendingUp, Lock, Users } from "lucide-react";

export function Floating3DPanel({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotateX: 45, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        rotateX: 0, 
        scale: 1,
      }}
      transition={{ 
        duration: 1.2, 
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      style={{ perspective: 1000 }}
      className="relative"
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotateY: [0, 2, 0],
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="glass-intense rounded-2xl p-6 shadow-premium-2xl border border-white/10"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/20 p-2.5">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Compliance Posture</div>
              <div className="text-2xl font-bold font-display">94%</div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary"
          />
        </div>
        
        <div className="space-y-3">
          {[
            { label: "Active Controls", value: "127", color: "text-primary" },
            { label: "Evidence Items", value: "483", color: "text-secondary" },
            { label: "At Risk", value: "8", color: "text-amber-400" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2 + i * 0.1 }}
              className="flex items-center justify-between glass-panel rounded-lg p-3"
            >
              <span className="text-sm text-foreground/70">{item.label}</span>
              <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-primary/20 blur-2xl"
        />
      </motion.div>
    </motion.div>
  );
}

export function FloatingWorkflowDiagram({ delay = 0 }: { delay?: number }) {
  const steps = [
    { icon: FileCheck, label: "Model", color: "text-blue-400" },
    { icon: Users, label: "Execute", color: "text-purple-400" },
    { icon: Shield, label: "Capture", color: "text-cyan-400" },
    { icon: TrendingUp, label: "Prove", color: "text-emerald-400" },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotateX: 30 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          rotateX: [0, -3, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="glass-frosted rounded-2xl p-6 shadow-premium-2xl border border-white/10"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-4">
          Compliance Lifecycle
        </div>
        
        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 + i * 0.15 }}
              className="relative"
            >
              <div className="flex items-center gap-3 glass-panel rounded-xl p-3 hover:glass-intense transition-all group">
                <div className={`rounded-lg bg-gradient-to-br from-white/10 to-white/5 p-2 group-hover:scale-110 transition-transform`}>
                  <step.icon className={`h-4 w-4 ${step.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{step.label}</div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  className={`h-2 w-2 rounded-full ${step.color.replace('text-', 'bg-')}`}
                />
              </div>
              
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: delay + 0.5 + i * 0.15, duration: 0.3 }}
                  className="absolute left-[26px] top-full h-3 w-0.5 bg-gradient-to-b from-primary/50 to-transparent origin-top"
                />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FloatingSecurityModule({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateZ: -5 }}
      animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ 
          y: [0, -12, 0],
          rotateZ: [0, 1, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="glass-panel-strong rounded-2xl p-6 shadow-premium-2xl border border-accent/20 relative overflow-hidden"
      >
        {/* Animated scan line */}
        <motion.div
          animate={{ y: ["0%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-accent/20 p-2.5">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Security Status</div>
              <div className="text-lg font-bold text-accent">Protected</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {[
              { label: "Encryption", status: "Active" },
              { label: "Audit Logs", status: "Recording" },
              { label: "Access Control", status: "Enforced" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.2 + i * 0.1 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground/70">{item.label}</span>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="h-2 w-2 rounded-full bg-accent"
                  />
                  <span className="text-accent font-semibold text-xs">{item.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl"
        />
      </motion.div>
    </motion.div>
  );
}
