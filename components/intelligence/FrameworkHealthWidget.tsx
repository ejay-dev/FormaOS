'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

type FrameworkReadiness = {
  frameworkId: string
  frameworkCode: string
  frameworkTitle: string
  readinessScore: number
  totalControls: number
  satisfiedControls: number
  missingControls: number
  partialControls: number
  evaluatedAt: string | null
}

type FrameworkHealthResponse = {
  combinedScore: number
  readinessTrend: number | null
  frameworks: FrameworkReadiness[]
  gaps: {
    missingEvidence: Array<{ controlKey: string; title?: string; required: number; approved: number }>
    unmappedControls: Array<{ controlId: string; controlCode: string; frameworkSlug: string }>
    weakAutomationCoverage: Array<{ controlKey: string; title?: string }>
  }
  recommendations: {
    nextActions: string[]
    evidenceRecommendations: string[]
    automationSuggestions: string[]
  }
  riskHeatmap: Record<string, Record<string, number>>
}

export function FrameworkHealthWidget() {
  const [data, setData] = useState<FrameworkHealthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const response = await fetch('/api/intelligence/framework-health')
        if (!response.ok) throw new Error('Failed to load framework health')
        const json = (await response.json()) as FrameworkHealthResponse
        if (mounted) setData(json)
      } catch {
        if (mounted) setData(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 180000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="h-20 rounded-xl bg-white/10" />
          <div className="h-20 rounded-xl bg-white/10" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const trendPositive = data.readinessTrend !== null && data.readinessTrend >= 0
  const TrendIcon = trendPositive ? TrendingUp : TrendingDown

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Framework Health
            </div>
            <div className="text-lg font-semibold text-slate-100">{data.combinedScore}% readiness</div>
          </div>
        </div>
        {data.readinessTrend !== null ? (
          <div className={`flex items-center gap-1 text-sm ${trendPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{Math.abs(data.readinessTrend)}% {trendPositive ? 'up' : 'down'}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {data.frameworks.slice(0, 4).map((framework) => (
          <div key={framework.frameworkId} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">{framework.frameworkTitle}</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-100">{framework.readinessScore}%</div>
              <div className="text-xs text-slate-400">{framework.totalControls} controls</div>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${framework.readinessScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Top Gaps</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {data.gaps.missingEvidence.slice(0, 2).map((gap) => (
              <li key={gap.controlKey} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                <span>{gap.title ?? gap.controlKey}</span>
              </li>
            ))}
            {data.gaps.missingEvidence.length === 0 ? (
              <li className="text-xs text-slate-500">No critical evidence gaps detected.</li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase">Next Actions</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {data.recommendations.nextActions.slice(0, 2).map((action, index) => (
              <li key={`${action}-${index}`} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase">Risk heatmap</div>
        <div className="mt-3 grid gap-2">
          {['critical', 'high', 'medium', 'low'].map((level) => (
            <div key={level} className="grid grid-cols-[80px_repeat(3,1fr)] items-center gap-2 text-xs text-slate-300">
              <div className="capitalize text-slate-400">{level}</div>
              {['compliant', 'at_risk', 'non_compliant'].map((status) => {
                const count = data.riskHeatmap?.[level]?.[status] ?? 0
                return (
                  <div
                    key={`${level}-${status}`}
                    className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-center"
                  >
                    <span className="text-slate-200">{count}</span>
                    <span className="ml-1 text-[10px] uppercase text-slate-500">{status.replace('_', ' ')}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
