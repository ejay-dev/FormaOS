/**
 * Evidence Pack Export Service
 * Generates audit-ready evidence bundles per framework
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSnapshotHistory } from './snapshot-service'
import archiver from 'archiver'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

export type ExportManifest = {
  exportId: string
  organizationId: string
  frameworkSlug: string
  frameworkName: string
  exportedAt: string
  exportedBy: string
  complianceScore: number
  contents: {
    controls: string
    evidence: string
    tasks: string
    policies: string
    automationLogs: string
    scoreHistory: string
    manifest: string
    summary: string
  }
  statistics: {
    totalControls: number
    satisfiedControls: number
    totalEvidence: number
    totalTasks: number
    totalPolicies: number
  }
}

/**
 * Create an export job
 */
export async function createExportJob(
  orgId: string,
  frameworkSlug: string,
  userId: string,
  passwordProtected: boolean = false
): Promise<{ ok: boolean; jobId?: string; error?: string }> {
  try {
    const admin = createSupabaseAdminClient()

    const { data: job, error } = await admin
      .from('compliance_export_jobs')
      .insert({
        organization_id: orgId,
        framework_slug: frameworkSlug,
        requested_by: userId,
        status: 'pending',
        password_protected: passwordProtected,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select('id')
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, jobId: job.id }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to create export job',
    }
  }
}

/**
 * Process export job (run as background task)
 */
export async function processExportJob(
  jobId: string
): Promise<{ ok: boolean; fileUrl?: string; error?: string }> {
  const admin = createSupabaseAdminClient()

  try {
    // Mark as processing
    await admin
      .from('compliance_export_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString(), progress: 0 })
      .eq('id', jobId)

    // Load job details
    const { data: job } = await admin
      .from('compliance_export_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) {
      throw new Error('Export job not found')
    }

    const { organization_id: orgId, framework_slug: frameworkSlug } = job

    // Gather data
    await updateProgress(jobId, 10)
    const controls = await getControlsData(orgId, frameworkSlug)

    await updateProgress(jobId, 30)
    const evidence = await getEvidenceData(orgId, frameworkSlug)

    await updateProgress(jobId, 50)
    const tasks = await getTasksData(orgId, frameworkSlug)

    await updateProgress(jobId, 60)
    const policies = await getPoliciesData(orgId)

    await updateProgress(jobId, 70)
    const automationLogs = await getAutomationLogs(orgId, frameworkSlug)

    await updateProgress(jobId, 80)
    const scoreHistory = await getSnapshotHistory(orgId, frameworkSlug, 365)

    // Build manifest
    const manifest: ExportManifest = {
      exportId: jobId,
      organizationId: orgId,
      frameworkSlug,
      frameworkName: controls.frameworkName || frameworkSlug.toUpperCase(),
      exportedAt: new Date().toISOString(),
      exportedBy: job.requested_by,
      complianceScore: scoreHistory[scoreHistory.length - 1]?.compliance_score || 0,
      contents: {
        controls: 'controls.json',
        evidence: 'evidence/',
        tasks: 'tasks.json',
        policies: 'policies.json',
        automationLogs: 'automation-logs.json',
        scoreHistory: 'score-history.json',
        manifest: 'index.json',
        summary: 'summary.csv',
      },
      statistics: {
        totalControls: controls.controls?.length || 0,
        satisfiedControls: controls.controls?.filter((c: any) => c.status === 'satisfied').length || 0,
        totalEvidence: evidence.evidence?.length || 0,
        totalTasks: tasks.tasks?.length || 0,
        totalPolicies: policies.policies?.length || 0,
      },
    }

    // Generate CSV summary
    const csvSummary = generateCSVSummary(manifest, controls, evidence, tasks)

    await updateProgress(jobId, 90)

    // Create ZIP (in-memory for now, would use S3/storage in production)
    const zipBuffer = await createZipBundle({
      manifest,
      controls,
      evidence,
      tasks,
      policies,
      automationLogs,
      scoreHistory,
      csvSummary,
    })

    // In production, upload to S3 and get URL
    // For now, we'll store a placeholder URL
    const fileUrl = `/api/compliance/exports/${jobId}/download`
    const fileSize = zipBuffer.length

    await admin
      .from('compliance_export_jobs')
      .update({
        status: 'completed',
        progress: 100,
        file_url: fileUrl,
        file_size: fileSize,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return { ok: true, fileUrl }
  } catch (error) {
    await admin
      .from('compliance_export_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Export failed',
      })
      .eq('id', jobId)

    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Export processing failed',
    }
  }
}

async function updateProgress(jobId: string, progress: number) {
  const admin = createSupabaseAdminClient()
  await admin.from('compliance_export_jobs').update({ progress }).eq('id', jobId)
}

async function getControlsData(orgId: string, frameworkSlug: string) {
  const admin = createSupabaseAdminClient()

  const { data: framework } = await admin
    .from('frameworks')
    .select('id, name')
    .eq('slug', frameworkSlug)
    .maybeSingle()

  if (!framework) {
    return { frameworkName: frameworkSlug, controls: [] }
  }

  const { data: controls } = await admin
    .from('framework_controls')
    .select('control_code, title, summary_description, default_risk_level')
    .eq('framework_id', framework.id)

  // Get control status from evaluations
  const { data: evaluations } = await admin
    .from('org_control_evaluations')
    .select('control_key, status, details')
    .eq('organization_id', orgId)

  const controlsWithStatus = (controls || []).map((c: { control_code: string }) => {
    const evaluation = evaluations?.find(
      (e: { control_key?: string }) => e.control_key?.includes(c.control_code),
    )
    return {
      ...c,
      status: evaluation?.status || 'unknown',
      details: evaluation?.details || {},
    }
  })

  return {
    frameworkName: framework.name,
    controls: controlsWithStatus,
  }
}

async function getEvidenceData(orgId: string, frameworkSlug: string) {
  const admin = createSupabaseAdminClient()

  const { data: evidence } = await admin
    .from('org_evidence')
    .select('id, title, evidence_type, verification_status, uploaded_at, file_url, metadata')
    .eq('organization_id', orgId)

  return { evidence: evidence || [] }
}

async function getTasksData(orgId: string, frameworkSlug: string) {
  const admin = createSupabaseAdminClient()

  const { data: tasks } = await admin
    .from('org_tasks')
    .select('id, title, description, status, priority, due_date, completed_at, created_at')
    .eq('organization_id', orgId)

  return { tasks: tasks || [] }
}

async function getPoliciesData(orgId: string) {
  const admin = createSupabaseAdminClient()

  const { data: policies } = await admin
    .from('org_policies')
    .select('id, title, version, status, last_reviewed_at, approved_at, created_at')
    .eq('organization_id', orgId)

  return { policies: policies || [] }
}

async function getAutomationLogs(orgId: string, frameworkSlug: string) {
  const admin = createSupabaseAdminClient()

  const { data: logs } = await admin
    .from('org_control_evaluations')
    .select('control_key, status, compliance_score, last_evaluated_at, details')
    .eq('organization_id', orgId)
    .order('last_evaluated_at', { ascending: false })
    .limit(1000)

  return { logs: logs || [] }
}

function generateCSVSummary(
  manifest: ExportManifest,
  controls: any,
  evidence: any,
  tasks: any
): string {
  const lines = [
    'Audit Evidence Pack Summary',
    `Framework,${manifest.frameworkName}`,
    `Export Date,${new Date(manifest.exportedAt).toLocaleDateString()}`,
    `Compliance Score,${manifest.complianceScore}%`,
    '',
    'Statistics',
    `Total Controls,${manifest.statistics.totalControls}`,
    `Satisfied Controls,${manifest.statistics.satisfiedControls}`,
    `Control Coverage,${Math.round((manifest.statistics.satisfiedControls / manifest.statistics.totalControls) * 100)}%`,
    `Total Evidence,${manifest.statistics.totalEvidence}`,
    `Total Tasks,${manifest.statistics.totalTasks}`,
    `Total Policies,${manifest.statistics.totalPolicies}`,
    '',
    'Control Code,Title,Status,Risk Level',
  ]

  controls.controls?.forEach((c: any) => {
    lines.push(
      `${c.control_code},"${c.title}",${c.status},${c.default_risk_level}`
    )
  })

  return lines.join('\n')
}

async function createZipBundle(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    // Add files to archive
    archive.append(JSON.stringify(data.manifest, null, 2), { name: 'index.json' })
    archive.append(JSON.stringify(data.controls, null, 2), { name: 'controls.json' })
    archive.append(JSON.stringify(data.evidence, null, 2), { name: 'evidence.json' })
    archive.append(JSON.stringify(data.tasks, null, 2), { name: 'tasks.json' })
    archive.append(JSON.stringify(data.policies, null, 2), { name: 'policies.json' })
    archive.append(JSON.stringify(data.automationLogs, null, 2), { name: 'automation-logs.json' })
    archive.append(JSON.stringify(data.scoreHistory, null, 2), { name: 'score-history.json' })
    archive.append(data.csvSummary, { name: 'summary.csv' })

    archive.finalize()
  })
}
