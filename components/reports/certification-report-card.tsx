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
    sky: 'bg-surface-1 border-border text-muted-foreground',
    indigo: 'bg-surface-1 border-border text-muted-foreground',
    pink: 'bg-surface-1 border-border text-muted-foreground',
    emerald: 'bg-surface-1 border-border text-muted-foreground',
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
      className={`rounded-2xl border p-6 relative overflow-hidden transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'motion-safe:hover:scale-[1.02] cursor-pointer'
      } ${colorClasses[color]}`}
      onClick={handleDownload}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-surface-2">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1">
          <Download className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase font-bold">PDF</span>
        </div>
      </div>
      <h4 className="text-lg font-bold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

      {disabled && (
        <div className="mt-3 text-xs text-warning flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Upgrade required
        </div>
      )}

      {!disabled && status === 'waiting' && (
        <div className="mt-3 text-xs text-foreground/70">
          Preparing export…
        </div>
      )}

      {!disabled && status === 'ready' && downloadUrl && (
        <div className="mt-3 text-xs text-success">
          Export ready. Download opened in a new tab.
        </div>
      )}

      {!disabled && status === 'error' && error && (
        <div className="mt-3 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
