'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, AlertTriangle, ShieldCheck } from 'lucide-react'

type Status = 'idle' | 'creating' | 'waiting' | 'ready' | 'error'

type Props = {
  title: string
  description: string
  reportType: string
  color: 'sky' | 'indigo' | 'pink' | 'emerald'
  disabled?: boolean
}

export function CertificationReportCard({
  title,
  description,
  reportType,
  color,
  disabled = false,
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const colorClasses = {
    sky: 'from-sky-500/20 to-sky-500/5 border-sky-400/20 text-sky-400',
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-400/20 text-indigo-400',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-400/20 text-pink-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/20 text-emerald-400',
  }

  async function pollJob(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/reports/exports/${jobId}/status`)
        if (!res.ok) {
          throw new Error('Failed to fetch export status')
        }
        const { job } = await res.json()
        if (job.status === 'completed' && job.fileUrl) {
          setDownloadUrl(job.fileUrl)
          setStatus('ready')
          if (pollRef.current) clearInterval(pollRef.current)
          window.open(job.fileUrl, '_blank')
        } else if (job.status === 'failed') {
          throw new Error(job.errorMessage || 'Export failed')
        } else {
          setStatus('waiting')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed')
        setStatus('error')
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 2000)

    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (status !== 'ready') {
        setError('Export is taking longer than expected. Please try again.')
        setStatus('error')
      }
    }, 5 * 60 * 1000)
  }

  async function handleDownload() {
    if (disabled || status === 'creating' || status === 'waiting') return
    setError(null)
    setStatus('creating')

    try {
      const res = await fetch(
        `/api/reports/export?type=${reportType}&format=pdf&mode=async`,
      )
      if (!res.ok) {
        throw new Error('Failed to start export')
      }
      const payload = await res.json().catch(() => ({}))
      if (!payload?.jobId) {
        throw new Error('Export job was not created')
      }
      setStatus('waiting')
      await pollJob(payload.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      setStatus('error')
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-6 relative overflow-hidden transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] cursor-pointer'
      } ${colorClasses[color]}`}
      onClick={handleDownload}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-white/10">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1">
          <Download className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] text-slate-400 uppercase font-bold">PDF</span>
        </div>
      </div>
      <h4 className="text-lg font-bold text-slate-100 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>

      {disabled && (
        <div className="mt-3 text-[10px] text-amber-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Upgrade required
        </div>
      )}

      {!disabled && status === 'waiting' && (
        <div className="mt-3 text-[10px] text-slate-300">
          Preparing export…
        </div>
      )}

      {!disabled && status === 'ready' && downloadUrl && (
        <div className="mt-3 text-[10px] text-emerald-300">
          Export ready. Download opened in a new tab.
        </div>
      )}

      {!disabled && status === 'error' && error && (
        <div className="mt-3 text-[10px] text-rose-300">
          {error}
        </div>
      )}
    </div>
  )
}
