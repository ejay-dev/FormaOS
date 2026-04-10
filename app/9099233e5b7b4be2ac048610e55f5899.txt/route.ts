import { NextResponse } from 'next/server';

export function GET() {
  return new NextResponse('9099233e5b7b4be2ac048610e55f5899', {
    headers: { 'Content-Type': 'text/plain' },
  });
}
