'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

type Snapshot = {
  snapshot_date: string
  compliance_score: number
}

type Props = {
  orgId: string
  frameworkSlug: string
  days?: 30 | 90 | 365
}

export function ComplianceScoreHistory({ orgId, frameworkSlug, days = 30 }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [regression, setRegression] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(days)

  useEffect(() => {
    loadHistory()
  }, [orgId, frameworkSlug, selectedPeriod])

  async function loadHistory() {
    setLoading(true)
    try {
      const [historyRes, regressionRes] = await Promise.all([
        fetch(`/api/compliance/snapshots/history?orgId=${orgId}&framework=${frameworkSlug}&days=${selectedPeriod}`),
        fetch(`/api/compliance/snapshots/regression?orgId=${orgId}&framework=${frameworkSlug}`)
      ])

      if (historyRes.ok) {
        const data = await historyRes.json()
        setSnapshots(data.snapshots || [])
      }

      if (regressionRes.ok) {
        const data = await regressionRes.json()
        setRegression(data.regression)
      }
    } catch (error) {
      console.error('Failed to load score history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  const currentScore = snapshots[snapshots.length - 1]?.compliance_score || 0
  const previousScore = snapshots[snapshots.length - 2]?.compliance_score || 0
  const scoreTrend = currentScore - previousScore

  return (
    <div className="space-y-4">
      {/* Regression Alert */}
      {regression?.hasRegression && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-rose-200">
              Score Regression Detected
            </div>
            <div className="text-xs text-rose-300 mt-1">
              Compliance score dropped {regression.drop}% from {regression.previousScore}% to {regression.currentScore}%
            </div>
          </div>
        </div>
      )}

      {/* Score History Card */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--panel-2))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Compliance Score History</h3>
          <div className="flex gap-2">
            {[30, 90, 365].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as 30 | 90 | 365)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {period}d
              </button>
            ))}
          </div>
        </div>

        {/* Current Score with Trend */}
        <div className="flex items-baseline gap-3 mb-6">
          <div className="text-4xl font-black text-slate-100">{currentScore}%</div>
          {scoreTrend !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${scoreTrend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {scoreTrend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(scoreTrend)}%</span>
            </div>
          )}
        </div>

        {/* Simple Line Chart */}
        <div className="relative h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {snapshots.length > 1 && (
              <polyline
                fill="none"
                stroke="rgb(56, 189, 248)"
                strokeWidth="2"
                points={snapshots
                  .map((s, i) => {
                    const x = (i / (snapshots.length - 1)) * 100
                    const y = 100 - s.compliance_score
                    return `${x},${y}`
                  })
                  .join(' ')}
              />
            )}
          </svg>
        </div>

        {/* Date Range */}
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>{snapshots[0]?.snapshot_date || '-'}</span>
          <span>{snapshots[snapshots.length - 1]?.snapshot_date || '-'}</span>
        </div>
      </div>

      {/* Improvement Metric */}
      {snapshots.length >= 2 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-400">Improvement Since Last Period</div>
          <div className={`text-2xl font-bold mt-1 ${scoreTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {scoreTrend >= 0 ? '+' : ''}{scoreTrend}%
          </div>
        </div>
      )}
    </div>
  )
}
