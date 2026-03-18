'use client';

import { motion } from 'framer-motion';
import { Check, Building2, GitBranch, Target } from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { structureFrameworks, structureControlMappings, structureRoadmapItems } from '../phase-demo-data';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.signature } },
};

function ComplianceBaselineRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-[72px] w-[72px] flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx="34" cy="34" r="30" fill="none"
          stroke="url(#baselineGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: easing.signature, delay: 2.0 }}
        />
        <defs>
          <linearGradient id="baselineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-base font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
        >
          {score}%
        </motion.span>
        <span className="text-[7px] text-slate-500 uppercase tracking-wider">Baseline</span>
      </div>
    </div>
  );
}

export default function StructureScreen() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Framework Selection */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Framework Selection</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {structureFrameworks.map((fw, i) => (
            <motion.div
              key={fw.id}
              className="relative rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 transition-all"
              animate={{
                borderColor: [`rgba(255,255,255,0.06)`, `rgba(255,255,255,0.06)`, fw.color + '50'],
                backgroundColor: [`rgba(255,255,255,0.03)`, `rgba(255,255,255,0.03)`, fw.color + '10'],
              }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.6, times: [0, 0.6, 1] }}
            >
              <p className="text-[11px] font-medium text-white truncate">{fw.name}</p>
              <p className="text-[9px] text-slate-500">{fw.controls} controls</p>
              <motion.div
                className="absolute top-1.5 right-1.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.6, duration: 0.3, ease: easing.signature }}
              >
                <div className="h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: fw.color + '30' }}>
                  <Check className="h-2.5 w-2.5" style={{ color: fw.color }} />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Control Mapping */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <GitBranch className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Control Mapping</span>
        </div>
        <div className="space-y-1.5">
          {structureControlMappings.map((mapping, i) => {
            const statusColor = mapping.status === 'mapped'
              ? 'bg-emerald-400'
              : mapping.status === 'mapping'
                ? 'bg-amber-400'
                : 'bg-slate-600';
            return (
              <motion.div
                key={mapping.control}
                className="flex items-center gap-2 text-[10px]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.4, ease: easing.signature }}
              >
                <motion.div
                  className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${mapping.status === 'pending' ? 'bg-slate-600' : ''}`}
                  animate={mapping.status === 'pending' ? {
                    backgroundColor: ['rgb(71,85,105)', 'rgb(71,85,105)', 'rgb(245,158,11)'],
                  } : {}}
                  transition={mapping.status === 'pending' ? { delay: 3.0 + i * 0.3, duration: 0.4 } : {}}
                >
                  {mapping.status !== 'pending' && <div className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />}
                </motion.div>
                <span className="text-slate-300 truncate flex-1">{mapping.control}</span>
                <span className="text-[9px] text-slate-500 flex-shrink-0 hidden sm:block">{mapping.framework}</span>
                <span className="text-[9px] text-slate-600 flex-shrink-0">{mapping.owner.split(' ')[0]}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom row: Baseline Score + Roadmap */}
      <div className="grid grid-cols-[auto_1fr] gap-3">
        {/* Baseline Score */}
        <motion.div
          variants={fadeUp}
          className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3"
        >
          <ComplianceBaselineRing score={62} />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Compliance</p>
            <p className="text-[10px] font-medium text-white">Baseline Score</p>
            <motion.p
              className="text-[9px] text-cyan-400 mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.2 }}
            >
              90 of 142 controls mapped
            </motion.p>
          </div>
        </motion.div>

        {/* Roadmap Timeline */}
        <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Target className="h-3 w-3 text-cyan-400" />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Roadmap</span>
          </div>
          <div className="flex items-center gap-2">
            {structureRoadmapItems.map((item, i) => {
              const dotColor = item.status === 'complete'
                ? 'bg-emerald-400'
                : item.status === 'in-progress'
                  ? 'bg-cyan-400'
                  : 'bg-slate-600';
              return (
                <div key={item.phase} className="flex-1 flex flex-col items-center text-center">
                  <motion.div
                    className="flex items-center w-full mb-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.5 + i * 0.3 }}
                  >
                    {i > 0 && (
                      <div className="flex-1 h-px bg-white/[0.08]">
                        {item.status !== 'pending' && (
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 3.8 + i * 0.3, duration: 0.5 }}
                          />
                        )}
                      </div>
                    )}
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor} ${item.status === 'in-progress' ? 'animate-pulse' : ''}`} />
                    {i < structureRoadmapItems.length - 1 && (
                      <div className="flex-1 h-px bg-white/[0.08]" />
                    )}
                  </motion.div>
                  <p className="text-[8px] text-slate-500 leading-tight">{item.phase}</p>
                  <p className="text-[8px] text-slate-400 leading-tight hidden sm:block">{item.task}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
