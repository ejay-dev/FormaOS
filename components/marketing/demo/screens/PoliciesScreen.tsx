'use client';

import { motion } from 'framer-motion';
import { FileText, Plus, Filter } from 'lucide-react';
import { demoPolicies } from '../demo-data';
import { easing, duration } from '@/config/motion';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.signature } },
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    draft: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    review: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    expired: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${styles[status] || styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function PoliciesScreen() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Policies</h2>
          <span className="text-[10px] text-slate-500">{demoPolicies.length} total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400 border border-white/[0.06]">
            <Filter className="h-2.5 w-2.5" />
            Filter
          </button>
          <button className="flex items-center gap-1 rounded-md bg-cyan-500/20 px-2 py-1 text-[10px] text-cyan-300 border border-cyan-500/30">
            <Plus className="h-2.5 w-2.5" />
            New Policy
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_90px_60px_70px_70px] gap-2 px-3 py-2 bg-white/[0.02] border-b border-white/[0.06] text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
          <span>Policy Name</span>
          <span>Owner</span>
          <span>Status</span>
          <span className="hidden sm:block">Reviewed</span>
          <span className="hidden sm:block">Next Review</span>
        </div>

        {/* Rows */}
        {demoPolicies.map((policy, i) => (
          <motion.div
            key={policy.id}
            variants={fadeUp}
            className={`
              grid grid-cols-[1fr_90px_60px_70px_70px] gap-2 px-3 py-2 items-center border-b border-white/[0.03] text-[10px]
              hover:bg-white/[0.02] transition-colors cursor-pointer
              ${i === 1 ? 'ring-1 ring-cyan-500/30 bg-cyan-500/[0.03]' : ''}
            `}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-5 w-5 rounded bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <FileText className="h-2.5 w-2.5 text-slate-500" />
              </div>
              <span className="text-slate-200 truncate font-medium">{policy.name}</span>
            </div>
            <span className="text-slate-400 truncate">{policy.owner.split(' ')[0]}</span>
            <StatusBadge status={policy.status} />
            <span className="text-slate-500 hidden sm:block text-[9px]">{policy.lastReview}</span>
            <span className="text-slate-500 hidden sm:block text-[9px]">{policy.nextReview}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Highlighted detail hint */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3 flex items-start gap-2"
      >
        <div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[8px] text-cyan-300">i</span>
        </div>
        <div className="text-[10px] text-slate-400">
          <span className="text-cyan-300 font-medium">Access Control Policy</span> is due for review.
          Click to view details and approve changes.
        </div>
      </motion.div>
    </motion.div>
  );
}
