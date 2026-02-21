import { NextResponse } from 'next/server';
import { EMPTY_SNAPSHOT, getPortfolioSnapshot } from '@/server/backend/portfolio';

export const revalidate = 60;

export async function GET() {
  try {
    const snapshot = await getPortfolioSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('GET /api/portfolio/snapshot failed:', error);
    }
    return NextResponse.json(EMPTY_SNAPSHOT);
  }
}
