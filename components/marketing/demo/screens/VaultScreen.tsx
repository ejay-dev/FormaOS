'use client';

import { motion } from 'framer-motion';
import { Lock, Plus, Upload, FileCheck, Clock, X } from 'lucide-react';
import { demoEvidence } from '../demo-data';
import { easing, duration } from '@/config/motion';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.signature } },
};

function EvidenceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: 'bg-emerald-500/15 text-emerald-400',
    pending: 'bg-amber-500/15 text-amber-400',
    rejected: 'bg-red-500/15 text-red-400',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${styles[status]}`}>
      {status === 'approved' && <FileCheck className="h-2 w-2 mr-0.5" />}
      {status === 'pending' && <Clock className="h-2 w-2 mr-0.5" />}
      {status === 'rejected' && <X className="h-2 w-2 mr-0.5" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const categories = [...new Set(demoEvidence.map((e) => e.category))];

export default function VaultScreen() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Evidence Vault</h2>
          <span className="text-[10px] text-slate-500">{demoEvidence.length} items</span>
        </div>
        <button className="flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-1 text-[10px] text-purple-300 border border-purple-500/30">
          <Upload className="h-2.5 w-2.5" />
          Upload Evidence
        </button>
      </motion.div>

      {/* Category pills */}
      <motion.div variants={fadeUp} className="flex gap-1.5 flex-wrap">
        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] text-white font-medium">
          All
        </span>
        {categories.map((cat) => (
          <span
            key={cat}
            className="rounded-full bg-white/[0.03] px-2 py-0.5 text-[9px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
          >
            {cat}
          </span>
        ))}
      </motion.div>

      {/* Evidence grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {demoEvidence.map((item, i) => (
          <motion.div
            key={item.id}
            variants={fadeUp}
            className={`
              rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 cursor-pointer
              hover:bg-white/[0.04] hover:border-white/[0.1] transition-all
              ${i === 1 ? 'ring-1 ring-emerald-500/30' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-200 truncate">{item.name}</p>
                <p className="text-[9px] text-slate-500">{item.category}</p>
              </div>
              <EvidenceStatusBadge status={item.status} />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>{item.uploadedBy}</span>
              <div className="flex items-center gap-2">
                <span>{item.size}</span>
                <span>{item.date}</span>
              </div>
            </div>

            {/* Animated checkmark for second item */}
            {i === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.3, ease: easing.signature }}
                className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-400"
              >
                <FileCheck className="h-2.5 w-2.5" />
                <span>Upload verified — chain of custody recorded</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
