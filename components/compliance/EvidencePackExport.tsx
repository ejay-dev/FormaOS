'use client'

import { useState } from 'react'
import { Download, Lock, FileArchive, Loader2 } from 'lucide-react'

type Props = {
  frameworkSlug: string
  frameworkName: string
}

export function EvidencePackExport({ frameworkSlug, frameworkName }: Props) {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [passwordProtected, setPasswordProtected] = useState(false)

  async function startExport() {
    setExporting(true)
    setProgress(0)
    setDownloadUrl(null)

    try {
      // Create export job
      const createRes = await fetch('/api/compliance/exports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameworkSlug, passwordProtected })
      })

      if (!createRes.ok) {
        throw new Error('Failed to create export job')
      }

      const { jobId: newJobId } = await createRes.json()
      setJobId(newJobId)

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/compliance/exports/${newJobId}/status`)

        if (!statusRes.ok) {
          clearInterval(pollInterval)
          setExporting(false)
          return
        }

        const { job } = await statusRes.json()
        setProgress(job.progress || 0)

        if (job.status === 'completed') {
          clearInterval(pollInterval)
          setDownloadUrl(job.fileUrl)
          setExporting(false)
        } else if (job.status === 'failed') {
          clearInterval(pollInterval)
          setExporting(false)
          alert('Export failed: ' + job.errorMessage)
        }
      }, 2000)

      // Cleanup after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000)

    } catch (error) {
      console.error('Export failed:', error)
      setExporting(false)
      alert('Export failed. Please try again.')
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--panel-2))] p-6">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileArchive className="h-5 w-5 text-sky-400" />
            <h3 className="text-lg font-semibold text-slate-100">Evidence Pack Export</h3>
          </div>
          <p className="text-sm text-slate-400">
            Generate audit-ready evidence bundle for {frameworkName}
          </p>

          <div className="mt-4 space-y-3">
            <div className="text-xs text-slate-400">
              Export includes:
            </div>
            <ul className="text-xs text-slate-300 space-y-1 ml-4">
              <li>• Controls list with status</li>
              <li>• Evidence attachments</li>
              <li>• Task audit trail</li>
              <li>• Policy revision history</li>
              <li>• Automation logs</li>
              <li>• Compliance score history</li>
              <li>• CSV summary for auditors</li>
            </ul>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={passwordProtected}
                onChange={(e) => setPasswordProtected(e.target.checked)}
                disabled={exporting}
                className="rounded border-white/20"
              />
              <Lock className="h-4 w-4" />
              Password protect export
            </label>
          </div>

          {exporting && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing export... {progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
              <div className="text-sm text-emerald-300 mb-2">Export ready!</div>
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Evidence Pack
              </a>
            </div>
          )}
        </div>

        <button
          onClick={startExport}
          disabled={exporting}
          className="px-4 py-2 rounded-lg bg-sky-500/20 text-sky-300 text-sm font-semibold border border-sky-400/30 hover:bg-sky-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? 'Exporting...' : 'Start Export'}
        </button>
      </div>
    </div>
  )
}
