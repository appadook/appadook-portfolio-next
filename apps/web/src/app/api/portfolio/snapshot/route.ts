import { NextResponse } from 'next/server';
import { getPortfolioSnapshot } from '@/server/backend/portfolio';

export const revalidate = 60;

export async function GET() {
  const snapshot = await getPortfolioSnapshot();
  return NextResponse.json(snapshot);
}
