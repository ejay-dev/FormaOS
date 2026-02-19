/**
 * Process Persistent Security Event Queue
 * 
 * This endpoint processes events that were queued due to database failures.
 * Should be called periodically via a cron job.
 * 
 * Requires founder token for security.
 */

import { NextResponse } from 'next/server';
import { processQueuedEvents, getQueueStats } from '@/lib/security/persistent-queue';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function verifyFounderToken(request: Request): boolean {
  const token = request.headers.get('x-founder-token') || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  const expectedToken = process.env.FOUNDER_API_TOKEN || process.env.HEALTH_DETAILED_FOUNDER_TOKEN;
  
  return token === expectedToken && !!expectedToken;
}

async function processEvent(type: string, payload: any): Promise<boolean> {
  try {
    const admin = createSupabaseAdminClient();
    
    if (type === 'security_event') {
      const { error } = await admin.from('security_events').insert({
        type: payload.type,
        severity: payload.severity || 'info',
        user_id: payload.userId || null,
        org_id: payload.orgId || null,
        ip_address: payload.ip || null,
        user_agent: payload.userAgent || null,
        device_fingerprint: payload.deviceFingerprint || null,
        request_path: payload.path || null,
        request_method: payload.method || null,
        status_code: payload.statusCode || null,
        metadata: payload.metadata || {},
      });
      return !error;
    } else if (type === 'user_activity') {
      const { error } = await admin.from('user_activity').insert({
        user_id: payload.userId,
        org_id: payload.orgId || null,
        action: payload.action,
        entity_type: payload.entityType || null,
        entity_id: payload.entityId || null,
        route: payload.route || null,
        metadata: payload.metadata || {},
      });
      return !error;
    }
    
    return false;
  } catch (error) {
    console.error('[QueueProcessor] Failed to process event:', error);
    return false;
  }
}

export async function POST(request: Request) {
  // Verify founder token
  if (!verifyFounderToken(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const stats = await getQueueStats();
    
    if (stats.size === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Queue is empty',
        stats,
      });
    }
    
    const result = await processQueuedEvents(processEvent);
    
    return NextResponse.json({
      ok: true,
      processed: result.processed,
      failed: result.failed,
      remainingInQueue: stats.size - result.processed,
    });
  } catch (error) {
    console.error('[QueueProcessor] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Verify founder token
  if (!verifyFounderToken(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const stats = await getQueueStats();
    
    return NextResponse.json({
      ok: true,
      ...stats,
    });
  } catch (error) {
    console.error('[QueueProcessor] Error getting stats:', error);
    return NextResponse.json(
      { error: 'Failed to get queue stats' },
      { status: 500 }
    );
  }
}
