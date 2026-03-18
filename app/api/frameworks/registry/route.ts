import { NextResponse } from 'next/server'
import { requireFounderAccess } from '@/app/app/admin/access'
import { getAvailableFrameworks } from '@/lib/frameworks/framework-registry'
import { getServerSideFeatureFlags } from '@/lib/feature-flags'
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/frameworks/registry');

export async function GET() {
  try {
    await requireFounderAccess()
    const flags = getServerSideFeatureFlags()
    if (!flags.enableFrameworkEngine) {
      return NextResponse.json({ ok: false, disabled: true }, { status: 404 })
    }

    const frameworks = await getAvailableFrameworks()
    return NextResponse.json({ ok: true, frameworks })
  } catch (error) {
    log.error({ err: error }, "/api/frameworks/registry error:")
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 })
  }
}
