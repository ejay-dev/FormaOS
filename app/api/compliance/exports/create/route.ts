import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createExportJob, processExportJob } from '@/lib/compliance/evidence-pack-export'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check org membership and role
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { frameworkSlug, passwordProtected } = await request.json()

    if (!frameworkSlug) {
      return NextResponse.json({ error: 'frameworkSlug is required' }, { status: 400 })
    }

    const result = await createExportJob(
      membership.organization_id,
      frameworkSlug,
      user.id,
      passwordProtected || false
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    const inlineProcessingEnabled =
      (process.env.EXPORTS_INLINE_PROCESSING ?? 'true') !== 'false'

    // Start processing job asynchronously (non-blocking)
    // Queue workers can also pick up pending jobs if inline processing is disabled or fails.
    if (result.jobId && inlineProcessingEnabled) {
      processExportJob(result.jobId, {
        workerId: 'inline',
        maxAttempts: 3,
      }).catch((err) => {
        console.error(`[exports/create] Background job ${result.jobId} failed:`, err)
      })
    }

    return NextResponse.json({ ok: true, jobId: result.jobId })
  } catch (error) {
    console.error('[exports/create] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
