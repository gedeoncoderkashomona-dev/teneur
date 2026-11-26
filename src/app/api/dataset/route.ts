import { NextResponse } from 'next/server';
import { getDataset } from '@/services/teneur-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getDataset();
  return NextResponse.json(result);
}
