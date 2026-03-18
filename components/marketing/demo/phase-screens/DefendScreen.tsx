'use client';

import { motion } from 'framer-motion';
import { Shield, FileText, Check, Loader2, Download, TrendingUp } from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { defendReportSections, defendComplianceHistory } from '../phase-demo-data';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.signature } },
};

function ComplianceTrendChart() {
  const data = defendComplianceHistory;
  const width = 280;
  const height = 80;
  const padding = { top: 8, right: 8, bottom: 16, left: 24 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minScore = 65;
  const maxScore = 100;
  const xStep = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - ((d.score - minScore) / (maxScore - minScore)) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;
  const pathLength = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return acc + Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
  }, 0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 2.5, duration: 0.8 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={pathLength}
        initial={{ strokeDashoffset: pathLength }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ delay: 1.5, duration: 1.5, ease: easing.signature }}
      />
      {/* Data points */}
      {points.map((p, i) => (
        <motion.circle
          key={data[i].month}
          cx={p.x}
          cy={p.y}
          r="2.5"
          fill="#0b1022"
          stroke={i === data.length - 1 ? '#06b6d4' : '#3b82f6'}
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 + (i / (data.length - 1)) * 1.5, duration: 0.3 }}
        />
      ))}
      {/* Final point pulse */}
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="5"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="1"
        animate={{ r: [5, 10, 5], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 3.5 }}
      />
      {/* Month labels */}
      {data.map((d, i) => (
        <text key={d.month} x={points[i].x} y={height - 2} textAnchor="middle" fill="#475569" fontSize="7">
          {d.month}
        </text>
      ))}
      {/* Score labels (first and last) */}
      <motion.text
        x={points[0].x - 2}
        y={points[0].y - 6}
        textAnchor="end"
        fill="#64748b"
        fontSize="7"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
      >
        {data[0].score}%
      </motion.text>
      <motion.text
        x={points[points.length - 1].x + 2}
        y={points[points.length - 1].y - 6}
        textAnchor="start"
        fill="#06b6d4"
        fontSize="8"
        fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2 }}
      >
        {data[data.length - 1].score}%
      </motion.text>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DefendScreen() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Report Bundle Builder */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <FileText className="h-3 w-3 text-pink-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Generating Report Pack</span>
          <motion.span
            className="ml-auto text-[9px] text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            27 pages
          </motion.span>
        </div>
        <div className="space-y-1.5">
          {defendReportSections.map((section, i) => {
            const genDelay = 0.5 + i * 1.2;
            const doneDelay = genDelay + 1.0;
            return (
              <motion.div
                key={section.name}
                className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5 text-[10px]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: genDelay - 0.3, duration: 0.4, ease: easing.signature }}
              >
                {/* Status indicator */}
                <motion.div
                  className="relative h-4 w-4 rounded-md flex items-center justify-center flex-shrink-0"
                  animate={{
                    backgroundColor: [
                      'rgba(255,255,255,0.04)',
                      'rgba(236,72,153,0.15)',
                      'rgba(16,185,129,0.15)',
                    ],
                  }}
                  transition={{ delay: genDelay, duration: doneDelay - genDelay, times: [0, 0.3, 1] }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ delay: genDelay, duration: 1.0, times: [0, 0.2, 1] }}
                  >
                    <Loader2 className="h-2.5 w-2.5 text-pink-400 animate-spin" />
                  </motion.div>
                  <motion.div
                    className="absolute"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: doneDelay, duration: 0.3, type: 'spring' }}
                  >
                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                  </motion.div>
                </motion.div>
                <span className="text-slate-200 truncate flex-1">{section.name}</span>
                <span className="text-[9px] text-slate-500 flex-shrink-0">{section.pages} pages</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Compliance Trend Chart */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Compliance Trend</span>
          <motion.span
            className="ml-auto flex items-center gap-1 text-[9px] text-emerald-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
          >
            <TrendingUp className="h-2.5 w-2.5" />
            +20% in 6 months
          </motion.span>
        </div>
        <ComplianceTrendChart />
      </motion.div>

      {/* Export Pack Ready */}
      <motion.div
        className="rounded-xl border overflow-hidden"
        initial={{ opacity: 0, y: 12, borderColor: 'rgba(255,255,255,0.06)' }}
        animate={{
          opacity: 1,
          y: 0,
          borderColor: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.06)', 'rgba(16,185,129,0.25)'],
        }}
        transition={{ delay: 5.0, duration: 0.8, ease: easing.signature }}
      >
        <div className="bg-gradient-to-r from-emerald-500/[0.06] to-cyan-500/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[11px] font-semibold text-white">Audit-Ready Export Pack</p>
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-medium text-emerald-400 uppercase">
                  Ready
                </span>
              </div>
              <p className="text-[9px] text-slate-400">4 reports · 27 pages · Generated 13 Feb 2026</p>
            </div>
            <motion.div
              className="flex-shrink-0 h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center cursor-pointer hover:bg-emerald-500/20 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 5.5, duration: 0.3 }}
            >
              <Download className="h-4 w-4 text-emerald-400" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
