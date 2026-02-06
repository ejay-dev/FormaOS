import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: job, error } = await supabase
      .from('compliance_export_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        fileUrl: job.file_url,
        fileSize: job.file_size,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        errorMessage: job.error_message,
      },
    })
  } catch (error) {
    console.error('[exports/status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
