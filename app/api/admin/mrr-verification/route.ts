import { NextResponse } from 'next/server';
import { requireFounderAccess } from '@/app/app/admin/access';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { verifyMrr } from '@/lib/admin/mrr-verification';

export async function GET() {
  try {
    await requireFounderAccess();
    const result = await verifyMrr();
    return NextResponse.json(result);
  } catch (error) {
    return handleAdminError(error, '/api/admin/mrr-verification');
  }
}
