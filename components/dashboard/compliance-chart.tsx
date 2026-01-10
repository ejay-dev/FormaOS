"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";

interface ComplianceDataPoint {
  month: string;
  score: number;
}

interface ComplianceChartProps {
  data: ComplianceDataPoint[];
  benchmark?: number; // e.g. target compliance score
}

export function ComplianceChart({ data, benchmark = 85 }: ComplianceChartProps) {
  return (
    <motion.div
      className="h-[320px] w-full rounded-2xl border border-white/10 bg-white/10 p-4 shadow-sm"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          {/* ===== GRADIENTS ===== */}
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#000000" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#000000" stopOpacity={0} />
            </linearGradient>

            {/* Risk zone shading */}
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.12} />  {/* Green */}
              <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.12} /> {/* Amber */}
              <stop offset="100%" stopColor="#dc2626" stopOpacity={0.12} /> {/* Red */}
            </linearGradient>
          </defs>

          {/* ===== GRID ===== */}
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f5f5f5"
          />

          {/* ===== AXES ===== */}
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#a3a3a3" }}
            dy={10}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#a3a3a3" }}
          />

          {/* ===== BENCHMARK LINE ===== */}
          <ReferenceLine
            y={benchmark}
            stroke="#16a34a"
            strokeDasharray="6 6"
            strokeWidth={1.5}
            label={{
              value: `Target ${benchmark}%`,
              position: "right",
              fill: "#16a34a",
              fontSize: 11,
              fontWeight: 700,
            }}
          />

          {/* ===== TOOLTIP ===== */}
          <Tooltip
            cursor={{ stroke: "#000", strokeWidth: 1, opacity: 0.05 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const value = payload[0].value as number;

              return (
                <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 shadow-xl">
                  <p className="text-xs font-bold text-slate-100">{label}</p>
                  <p className="text-sm font-black text-slate-100">
                    {value}%
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {value >= benchmark
                      ? "On target"
                      : value >= 70
                      ? "Needs attention"
                      : "High risk"}
                  </p>
                </div>
              );
            }}
          />

          {/* ===== AREA FILL ===== */}
          <Area
            type="monotone"
            dataKey="score"
            stroke="#000000"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#scoreGradient)"
            activeDot={{ r: 5, stroke: "#000", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}